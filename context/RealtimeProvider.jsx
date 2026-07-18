"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const supabaseRef = useRef(null);

  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  const loadPrefs = useCallback(async (supabase, user) => {
    try {
      const roleStr = user.user_metadata?.role || user.role || "";
      const userRole = roleStr.toUpperCase();

      if (userRole === "CUSTOMER") {
        const { data: profile } = await supabase
          .from("CustomerProfile")
          .select("notification_prefs")
          .eq("owner_user_id", user.id)
          .maybeSingle();
        return profile?.notification_prefs || null;
      } else if (userRole === "CREATOR") {
        const { data: profile } = await supabase
          .from("CreatorProfile")
          .select("notification_prefs")
          .eq("owner_user_id", user.id)
          .maybeSingle();
        return profile?.notification_prefs || null;
      } else if (userRole === "BRANDOWNER" || userRole === "BRAND") {
        const { data: profile } = await supabase
          .from("BrandProfile")
          .select("notification_prefs")
          .eq("owner_user_id", user.id)
          .maybeSingle();
        return profile?.notification_prefs || null;
      }
    } catch (err) {
      console.error("Failed to load user notification prefs:", err);
    }
    return null;
  }, []);

  useEffect(() => {
    const supabase = supabaseRef.current;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const loadedPrefs = await loadPrefs(supabase, user);
      setPrefs(loadedPrefs);

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
            const newNotif = payload.new;

            setNotifications((prev) => [newNotif, ...prev]);

            const currentPrefs = await loadPrefs(supabase, user);
            setPrefs(currentPrefs);

            let desktopAllowed = true; // Default fallback

            if (currentPrefs) {
              const notifType = newNotif.type;
              if (notifType === "new_message") {
                desktopAllowed = currentPrefs.newMessage?.desktop ?? true;
              } else if (notifType === "request_responded") {
                desktopAllowed = currentPrefs.requestResponded?.desktop ?? true;
              } else if (
                notifType === "request_accepted" ||
                notifType === "request_status_changed" ||
                notifType === "request_declined"
              ) {
                desktopAllowed = currentPrefs.requestStatusChanged?.desktop ?? false;
              }
            }

            if (desktopAllowed) {
              setToast(newNotif);

              if (
                typeof window !== "undefined" &&
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                try {
                  new Notification(newNotif.title, {
                    body: newNotif.body,
                    icon: "/favicon.ico"
                  });
                } catch (e) {
                  console.error("Failed to display native notification popup:", e);
                }
              }
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
  }, [loadPrefs]);

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
