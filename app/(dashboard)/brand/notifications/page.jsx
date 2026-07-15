"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, CheckCircle, XCircle, Sparkles, Users, Package, TrendingUp, Lock, Loader2 } from "lucide-react";
import Button from "@/components/ui/button";

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "collab_pitch",
    title: "New Collaboration Pitch",
    time: "45m ago",
    description: "Maya Rivera pitched a barter collaboration for your Kyoto Knife Series.",
    dateGroup: "Today",
    isRead: false,
    link: "/brand#collaboration-requests",
    Icon: Users,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50"
  },
  {
    id: 2,
    type: "customer_request",
    title: "New Customer Request",
    time: "2h ago",
    description: "A customer sent a custom commission request for a wood-fired mug set.",
    dateGroup: "Today",
    isRead: false,
    link: "/brand/messages",
    Icon: MessageCircle,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50"
  },
  {
    id: 3,
    type: "ai_match",
    title: "New AI Creator Matches",
    time: "4h ago",
    description: "We found 3 new creators with a 90%+ compatibility score for your brand.",
    dateGroup: "Today",
    isRead: false,
    link: "/brand#ai-creator-match",
    Icon: Sparkles,
    iconColor: "text-brand-primary",
    iconBg: "bg-brand-primary/10"
  },
  {
    id: 4,
    type: "pitch_status",
    title: "Collaboration Accepted",
    time: "Yesterday",
    description: "You accepted Jordan Lee's pitch for the Ochre Clay tableware line.",
    dateGroup: "Yesterday",
    isRead: true,
    link: "/brand#collaboration-requests",
    Icon: CheckCircle,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50"
  },
  {
    id: 5,
    type: "pitch_status",
    title: "Collaboration Declined",
    time: "Yesterday",
    description: "You declined a paid collaboration pitch from Alex Chen.",
    dateGroup: "Yesterday",
    isRead: true,
    link: "/brand#collaboration-requests",
    Icon: XCircle,
    iconColor: "text-red-500",
    iconBg: "bg-red-50"
  },
  {
    id: 6,
    type: "product",
    title: "Product Marked Sold Out",
    time: "Yesterday",
    description: "\"Speckled Stoneware Mug\" automatically flagged as sold out.",
    dateGroup: "Yesterday",
    isRead: true,
    link: "/brand/products",
    Icon: Package,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50"
  },
  {
    id: 7,
    type: "ai_usage",
    title: "AI Generation Limit Reached",
    time: "30 Jun",
    description: "You've used all 3 free generations for Brand Story Generator. Upgrade for unlimited access.",
    dateGroup: "30 Jun",
    isRead: true,
    link: "/brand/ai-studio/upgrade",
    Icon: Lock,
    iconColor: "text-brand-primary",
    iconBg: "bg-brand-primary/10"
  },
  {
    id: 8,
    type: "insight",
    title: "Trending Category Alert",
    time: "30 Jun",
    description: "\"Minimalist ceramics\" is trending platform-wide — consider a related campaign.",
    dateGroup: "30 Jun",
    isRead: true,
    link: "/brand/ai-studio",
    Icon: TrendingUp,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50"
  }
];

function formatDBNotification(notif) {
  const IconMap = {
    collab_pitch: Users,
    customer_request: MessageCircle,
    ai_match: Sparkles,
    pitch_status: CheckCircle,
    product: Package,
    ai_usage: Lock,
    insight: TrendingUp
  };

  const ColorMap = {
    collab_pitch: "text-purple-600",
    customer_request: "text-blue-600",
    ai_match: "text-brand-primary",
    pitch_status: "text-emerald-600",
    product: "text-amber-600",
    ai_usage: "text-brand-primary",
    insight: "text-emerald-600"
  };

  const BgMap = {
    collab_pitch: "bg-purple-50",
    customer_request: "bg-blue-50",
    ai_match: "bg-brand-primary/10",
    pitch_status: "bg-emerald-50",
    product: "bg-amber-50",
    ai_usage: "bg-brand-primary/10",
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

  let link = "/brand";
  if (notif.type === 'customer_request') link = "/brand/messages";
  else if (notif.type === 'product') link = "/brand/products";
  else if (notif.type === 'ai_usage') link = "/brand/ai-studio/upgrade";
  else if (notif.type === 'ai_match') link = "/brand#ai-creator-match";

  return {
    id: notif.id,
    type: notif.type,
    title: notif.title || "Notification",
    time,
    description: notif.body || "",
    dateGroup,
    isRead: notif.is_read,
    link,
    Icon: IconMap[notif.type] || Package,
    iconColor: ColorMap[notif.type] || "text-amber-600",
    iconBg: BgMap[notif.type] || "bg-amber-50"
  };
}

export default function BrandNotificationsPage() {
  const [dbNotifications, setDbNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch("/api/brand/notifications");
        if (res.ok) {
          const data = await res.json();
          setDbNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadNotifications();
  }, []);

  const formattedDbNotifs = dbNotifications.map(formatDBNotification);
  
  // Merge and prioritize DB notifications
  const mergedNotifications = [
    ...formattedDbNotifs,
    ...MOCK_NOTIFICATIONS.filter(mock => !formattedDbNotifs.some(db => db.title === mock.title))
  ];

  const unreadCount = mergedNotifications.filter(n => !n.isRead).length;

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/brand/notifications", { method: "PATCH" });
      if (res.ok) {
        setDbNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      const isDbNotif = typeof id === "string";
      if (isDbNotif) {
        await fetch("/api/brand/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        });
        setDbNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const grouped = mergedNotifications.reduce((acc, notif) => {
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
        <Button variant="outline" size="sm" onClick={markAllAsRead} className="text-xs font-semibold px-4">
          Mark all as Read
        </Button>
      </div>

      
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-brand-border/50 p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
          <span className="text-sm font-semibold text-brand-muted">Loading notifications...</span>
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
                    className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                      idx !== grouped[group].length - 1 ? "border-b border-brand-border/40" : ""
                    } ${
                      notif.isRead
                        ? "opacity-80 hover:opacity-100"
                        : "bg-[#fdfbfa]"
                    }`}
                  >
                    
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.iconBg}`}>
                      <notif.Icon className={`w-5 h-5 ${notif.iconColor}`} />
                    </div>

                    
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

                    
                    <Link
                      href={notif.link}
                      onClick={() => markAsRead(notif.id)}
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
      )}

    </div>
  );
}
