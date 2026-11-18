"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const RealtimeContext = createContext(null);

const NOTIF_TYPE_TO_PREF_KEYS = {
  new_message: ["newMessage", "messages"],
  message_request: ["newMessage", "messages", "newRequest"],
  custom_request: ["newRequest"],
  request_responded: ["brandResponse", "requestStatus"],
  request_accepted: ["requestStatus", "newMessage", "messages"],
  collab_pitch: ["newPitch", "brandMatchFound", "pitchResponse"],
  pitch_status: ["pitchResponse", "newPitch"],
  ai_match: ["aiMatch", "brandMatchFound"],
  recommended_brand: ["newRecommended"],
};

function shouldShowDesktopToast(notif, prefs) {
  if (!prefs || typeof prefs !== "object") return true;
  const candidateKeys = NOTIF_TYPE_TO_PREF_KEYS[notif?.type];
  if (!candidateKeys) return true;
  for (const key of candidateKeys) {
    if (!(key in prefs)) continue;
    const entry = prefs[key];
    if (entry === false) return false;
    if (entry && typeof entry === "object" && "desktop" in entry) {
      return Boolean(entry.desktop);
    }
  }
  return true;
}

export function RealtimeProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const supabaseRef = useRef(null);
  const notifPrefsRef = useRef(null);

  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  useEffect(() => {
    const supabase = supabaseRef.current;

    async function loadNotificationPrefs(uid) {
      try {
        const { data: cust } = await supabase
          .from("CustomerProfile")
          .select("notification_prefs")
          .eq("owner_user_id", uid)
          .maybeSingle();
        if (cust?.notification_prefs) {
          notifPrefsRef.current = cust.notification_prefs;
          return;
        }
        const { data: brand } = await supabase
          .from("BrandProfile")
          .select("notification_prefs")
          .eq("owner_user_id", uid)
          .maybeSingle();
        if (brand?.notification_prefs) {
          notifPrefsRef.current = brand.notification_prefs;
          return;
        }
        const { data: creator } = await supabase
          .from("CreatorProfile")
          .select("notification_prefs")
          .eq("owner_user_id", uid)
          .maybeSingle();
        if (creator?.notification_prefs) {
          notifPrefsRef.current = creator.notification_prefs;
        }
      } catch (_) {}
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      await loadNotificationPrefs(user.id);

      const { data } = await supabase
        .from("Notification")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setNotifications(data || []);

      const channel = supabase
        .channel(`realtime-user-${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "Notification", filter: `user_id=eq.${user.id}` },
          async (payload) => {
            setNotifications((prev) => [payload.new, ...prev]);
            await loadNotificationPrefs(user.id);
            if (shouldShowDesktopToast(payload.new, notifPrefsRef.current)) {
              setToast(payload.new);
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "Notification", filter: `user_id=eq.${user.id}` },
          (payload) => {
            setNotifications((prev) => prev.map((n) => (n.id === payload.new.id ? payload.new : n)));
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "Notification", filter: `user_id=eq.${user.id}` },
          (payload) => {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        )
        .subscribe((status) => {
          console.log("Realtime channel status:", status);
        });

      return () => supabase.removeChannel(channel);
    }

    const cleanupPromise = init();
    return () => { cleanupPromise.then((cleanup) => cleanup && cleanup()); };
  }, []);

  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    await fetch("/api/notifications", { method: "DELETE" });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <RealtimeContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearAll, toast, dismissToast, supabase: supabaseRef.current, userId }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime must be used within RealtimeProvider");
  return ctx;
}
