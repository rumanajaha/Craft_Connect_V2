import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    async function fetchUnreadCount() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { count, error } = await supabase
          .from("Notification")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        if (!error && count !== null) {
          setUnreadCount(count);
        }
      } catch (err) {
        console.error("Error fetching unread notifications count:", err);
      }
    }

    fetchUnreadCount();

    // Subscribe to new notifications using Supabase Realtime so it updates live
    const channel = supabase
      .channel("notification-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Notification",
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return unreadCount;
}
