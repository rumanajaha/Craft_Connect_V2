"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MessageCircle, CheckCircle, Sparkles, User, Package, Clock, ShieldAlert } from "lucide-react";
import Button from "@/components/ui/button";

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "pitch_accepted",
    title: "Pitch Accepted!",
    time: "20m ago",
    description: "Ochre Clay Studio has accepted your pitch for the 'Slow Sunday' series.",
    dateGroup: "Today",
    isRead: false,
    link: "/creator",
    Icon: CheckCircle,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50"
  },
  {
    id: 2,
    type: "message",
    title: "New Message from Soren Objects",
    time: "2h ago",
    description: "Soren Objects sent you a message about the coffee table props collaboration.",
    dateGroup: "Today",
    isRead: false,
    link: "/creator/messages",
    Icon: MessageCircle,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50"
  },
  {
    id: 3,
    type: "ai_match",
    title: "New Brand Match Found",
    time: "5h ago",
    description: "Our AI found a 94% compatibility match with Gaea Weaves.",
    dateGroup: "Today",
    isRead: false,
    link: "/creator",
    Icon: Sparkles,
    iconColor: "text-brand-primary",
    iconBg: "bg-brand-primary/10"
  },
  {
    id: 4,
    type: "message",
    title: "New Message from Ochre Clay Studio",
    time: "Yesterday",
    description: "Ochre Clay Studio replied: 'We would love to send you a set of mugs...'",
    dateGroup: "Yesterday",
    isRead: true,
    link: "/creator/messages",
    Icon: MessageCircle,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50"
  },
  {
    id: 5,
    type: "collab_update",
    title: "Campaign Budget Updated",
    time: "Yesterday",
    description: "Gaea Weaves updated the budget for your textile tour campaign to $500.",
    dateGroup: "Yesterday",
    isRead: true,
    link: "/creator",
    Icon: Clock,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50"
  },
  {
    id: 6,
    type: "system",
    title: "Profile Completed",
    time: "3 days ago",
    description: "Welcome to CraftConnect! Your creator profile is now live for brand matching.",
    dateGroup: "3 days ago",
    isRead: true,
    link: "/creator/settings",
    Icon: User,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50"
  }
];

export default function CreatorNotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Group notifications by dateGroup
  const grouped = notifications.reduce((acc, notif) => {
    const key = notif.dateGroup;
    if (!acc[key]) acc[key] = [];
    acc[key].push(notif);
    return acc;
  }, {});

  const groups = ["Today", "Yesterday", "3 days ago"].filter(g => grouped[g]);

  return (
    <div className="max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-dark">Notifications</h1>
          <p className="text-brand-muted text-sm mt-1.5">
            You have <span className="font-bold text-brand-primary">{unreadCount}</span> {unreadCount === 1 ? 'notification' : 'notifications'} to review
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllAsRead} className="text-xs font-semibold px-4">
          Mark all as Read
        </Button>
      </div>

      {/* Grouped List */}
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
                  className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                    idx !== grouped[group].length - 1 ? "border-b border-brand-border/40" : ""
                  } ${
                    notif.isRead 
                      ? "opacity-80 hover:opacity-100" 
                      : "bg-[#fdfbfa]"
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.iconBg}`}>
                    <notif.Icon className={`w-5 h-5 ${notif.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-bold truncate ${notif.isRead ? "text-brand-dark/90" : "text-brand-dark"}`}>
                        {notif.title}
                      </h3>
                      <span className="text-xs text-brand-muted shrink-0">• {notif.time}</span>
                      {!notif.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 ml-1 shadow-[0_0_4px_rgba(239,94,36,0.5)]" />
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 truncate ${notif.isRead ? "text-brand-muted" : "text-brand-dark/75 font-medium"}`}>
                      {notif.description}
                    </p>
                  </div>

                  {/* Action */}
                  <Link 
                    href={notif.link}
                    className="text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors shrink-0 px-3 py-1.5 tracking-wide"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
