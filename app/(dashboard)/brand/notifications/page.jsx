"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, CheckCircle, XCircle, Sparkles, Users, Package, TrendingUp, Lock, Loader2 } from "lucide-react";
import Button from "@/components/ui/button";
import { useRealtime } from "@/context/RealtimeProvider";

function formatDBNotification(notif) {
  const IconMap = {
    collab_pitch: Users,
    message_request: MessageCircle,
    new_message: MessageCircle,
    message: MessageCircle,
    request_accepted: CheckCircle,
    pitch_status: CheckCircle,
    product_status: Package,
    ai_limit: Lock,
    ai_match: Sparkles,
    insight: TrendingUp
  };

  const ColorMap = {
    collab_pitch: "text-purple-600",
    message_request: "text-blue-600",
    new_message: "text-blue-600",
    message: "text-blue-600",
    request_accepted: "text-emerald-600",
    pitch_status: "text-emerald-600",
    product_status: "text-amber-600",
    ai_limit: "text-brand-primary",
    ai_match: "text-brand-primary",
    insight: "text-emerald-600"
  };

  const BgMap = {
    collab_pitch: "bg-purple-50",
    message_request: "bg-blue-50",
    new_message: "bg-blue-50",
    message: "bg-blue-50",
    request_accepted: "bg-emerald-50",
    pitch_status: "bg-emerald-50",
    product_status: "bg-amber-50",
    ai_limit: "bg-brand-primary/10",
    ai_match: "bg-brand-primary/10",
    insight: "bg-emerald-50"
  };

  const createdAt = new Date(notif.created_at);
  const now = new Date();
  const diffMs = now - createdAt;
  const diffMin = Math.round(diffMs / 60000);
  const diffHr = Math.round(diffMs / 3600000);

  let time = "Just now";
  let dateGroup = "Today";

  if (diffMin < 60) {
    time = `${diffMin}m ago`;
  } else if (diffHr < 24) {
    time = `${diffHr}h ago`;
  } else if (diffHr < 48) {
    time = "Yesterday";
    dateGroup = "Yesterday";
  } else {
    time = createdAt.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    dateGroup = time;
  }

  return {
    id: notif.id,
    type: notif.type,
    title: notif.title || "Notification",
    time,
    description: notif.body || "",
    dateGroup,
    is_read: notif.is_read,
    link: notif.link || "/brand",
    Icon: IconMap[notif.type] || Package,
    iconColor: ColorMap[notif.type] || "text-amber-600",
    iconBg: BgMap[notif.type] || "bg-amber-50"
  };
}

export default function BrandNotificationsPage() {
  const { notifications: rawNotifications, unreadCount, markAsRead, markAllAsRead, clearAll, userId } = useRealtime();
  const router = useRouter();

  const handleNotificationClick = async (notif) => {
    await markAsRead(notif.id);
    router.push(notif.link);
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to permanently clear all notifications? This action is irreversible.")) {
      clearAll();
    }
  };

  const notifications = rawNotifications.map(formatDBNotification);
  const isLoading = !userId;

  const grouped = notifications.reduce((acc, notif) => {
    if (!acc[notif.dateGroup]) acc[notif.dateGroup] = [];
    acc[notif.dateGroup].push(notif);
    return acc;
  }, {});

  const groups = Object.keys(grouped).sort((a, b) => {
    if (a === "Today") return -1;
    if (b === "Today") return 1;
    if (a === "Yesterday") return -1;
    if (b === "Yesterday") return 1;
    return new Date(b) - new Date(a);
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-dark">Notifications</h1>
          <p className="text-brand-muted text-sm mt-1.5">
            You have <span className="font-bold text-brand-primary">{unreadCount}</span> {unreadCount === 1 ? 'notification' : 'notifications'} to go through
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead} className="text-xs font-semibold px-4">
            Mark all as Read
          </Button>
          <button
            onClick={handleClearAll}
            className="text-xs font-semibold px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition-colors active:bg-red-100"
          >
            Clear All
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-brand-border/50 p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
          <span className="text-sm font-semibold text-brand-muted">Loading notifications...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-border/50 p-12 flex flex-col items-center justify-center text-center">
          <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
          <span className="text-sm font-semibold text-brand-dark">All caught up!</span>
          <p className="text-xs text-brand-muted mt-1">You have no new notifications.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(group => (
            <div key={group}>
              <h2 className="text-sm font-semibold text-brand-dark/70 mb-3 px-1">
                {group}
              </h2>
              <div className="bg-white rounded-2xl border border-brand-border/50 shadow-sm overflow-hidden flex flex-col">
                {grouped[group].map((notif, idx) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-center gap-4 px-5 py-4 transition-all duration-200 cursor-pointer hover:bg-brand-border/10 ${idx !== grouped[group].length - 1 ? "border-b border-brand-border/40" : ""
                      } ${notif.is_read
                        ? "opacity-80 hover:opacity-100"
                        : "bg-[#fdfbfa]"
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.iconBg}`}>
                      <notif.Icon className={`w-5 h-5 ${notif.iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-bold truncate ${notif.is_read ? "text-brand-dark/90" : "text-brand-dark"}`}>
                          {notif.title}
                        </h3>
                        <span className="text-xs text-brand-muted shrink-0">• {notif.time}</span>
                        {!notif.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 ml-1 shadow-[0_0_4px_rgba(239,94,36,0.5)]" />
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 truncate ${notif.is_read ? "text-brand-muted" : "text-brand-dark/75 font-medium"}`}>
                        {notif.description}
                      </p>
                    </div>

                    <span
                      className="text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors shrink-0 px-3 py-1.5 tracking-wide"
                    >
                      View
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}