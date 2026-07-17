"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const supabaseRef = useRef(null);

  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  useEffect(() => {
    const supabase = supabaseRef.current;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

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
          (payload) => {
            setNotifications((prev) => [payload.new, ...prev]);
            setToast(payload.new);
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
