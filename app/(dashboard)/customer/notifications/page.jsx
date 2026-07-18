"use client";

import React, { useState, useEffect } from "react";
import Link from "next/navigation";
import { useRouter } from "next/navigation";
import { MessageCircle, CheckCircle, Sparkles, User, FileText, Trash2, Loader2, BellOff } from "lucide-react";
import Button from "@/components/ui/button";

function getNotificationIcon(type) {
  switch (type) {
    case "message":
    case "new_message":
    case "message_request":
      return { Icon: MessageCircle, color: "text-blue-600", bg: "bg-blue-50" };
    case "custom_request":
      return { Icon: FileText, color: "text-amber-600", bg: "bg-amber-50" };
    case "request_responded":
      return { Icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" };
    case "recommendation":
    case "new_picks":
      return { Icon: Sparkles, color: "text-brand-primary", bg: "bg-brand-primary/10" };
    default:
      return { Icon: User, color: "text-purple-600", bg: "bg-purple-50" };
  }
}

function getDateGroup(createdAtString) {
  const date = new Date(createdAtString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  }
}

function getTimeAgo(createdAtString) {
  const date = new Date(createdAtString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.round(diffMs / 60000);
  const diffHr = Math.round(diffMs / 3600000);

  if (diffMin < 60) {
    return diffMin <= 1 ? "Just now" : `${diffMin}m ago`;
  } else if (diffHr < 24) {
    return `${diffHr}h ago`;
  } else if (diffHr < 48) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  }
}

export default function CustomerNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [marking, setMarking] = useState(false);

  async function loadNotifications() {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllAsRead = async () => {
    if (notifications.length === 0) return;
    try {
      setMarking(true);
      const res = await fetch("/api/notifications", { method: "PATCH" });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    } finally {
      setMarking(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    // If unread, mark as read on the database
    if (!notif.is_read) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: notif.id })
        });
        setNotifications(prev =>
          prev.map(n => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      } catch (err) {
        console.error("Error marking notification read:", err);
      }
    }
    // Redirect to link
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const clearAllNotifications = async () => {
    if (notifications.length === 0) return;
    const confirmed = window.confirm("Are you sure you want to clear all notifications?");
    if (!confirmed) return;

    try {
      setClearing(true);
      const res = await fetch("/api/notifications", { method: "DELETE" });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Error clearing notifications:", err);
    } finally {
      setClearing(false);
    }
  };

  // Group notifications dynamically
  const grouped = notifications.reduce((acc, notif) => {
    const group = getDateGroup(notif.created_at);
    if (!acc[group]) acc[group] = [];
    acc[group].push(notif);
    return acc;
  }, {});

  // Maintain chronological group headers
  const groups = Object.keys(grouped).sort((a, b) => {
    if (a === "Today") return -1;
    if (b === "Today") return 1;
    if (a === "Yesterday") return -1;
    if (b === "Yesterday") return 1;
    return new Date(b) - new Date(a);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-brand-muted text-sm mt-3 font-semibold">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-brand-dark">Notifications</h1>
          <p className="text-brand-muted text-xs mt-1">
            You have <span className="font-bold text-brand-primary">{unreadCount}</span> unread {unreadCount === 1 ? 'notification' : 'notifications'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                isLoading={marking}
                className="text-xs font-semibold px-3 h-9"
              >
                Mark all read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllNotifications}
                isLoading={clearing}
                className="text-xs font-semibold px-3 text-red-600 hover:text-red-700 hover:bg-red-50/50 border-red-200 hover:border-red-300 h-9 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear all
              </Button>
            </>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-brand-border/50 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-brand-border/20 flex items-center justify-center mx-auto mb-4">
            <BellOff className="w-6 h-6 text-brand-muted" />
          </div>
          <h3 className="font-serif text-lg font-bold text-brand-dark mb-1">All caught up!</h3>
          <p className="text-sm text-brand-muted max-w-xs mx-auto">
            You don't have any notifications at the moment. We'll let you know when something new arrives!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <div key={group} className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-muted px-1">
                {group}
              </h2>
              <div className="bg-white rounded-2xl border border-brand-border/50 shadow-sm overflow-hidden divide-y divide-brand-border/30">
                {grouped[group].map((notif) => {
                  const { Icon, color, bg } = getNotificationIcon(notif.type);
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`flex items-center gap-4 px-5 py-4 transition-colors cursor-pointer group ${
                        notif.is_read
                          ? "hover:bg-brand-border/10 opacity-70 hover:opacity-100"
                          : "bg-brand-primary/[0.01] hover:bg-brand-border/20"
                      }`}
                    >
                      <div className={`w-9.5 h-9.5 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon className={`w-4.5 h-4.5 ${color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-bold truncate ${notif.is_read ? "text-brand-dark/85" : "text-brand-dark"}`}>
                            {notif.title}
                          </h3>
                          <span className="text-[10px] text-brand-muted/70 shrink-0">
                            {getTimeAgo(notif.created_at)}
                          </span>
                          {!notif.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 shadow-[0_0_4px_rgba(239,94,36,0.5)]" />
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 line-clamp-1 ${notif.is_read ? "text-brand-muted" : "text-brand-dark/75 font-medium"}`}>
                          {notif.body}
                        </p>
                      </div>

                      {notif.link && (
                        <div className="text-xs font-bold text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity pl-2 shrink-0">
                          View →
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}