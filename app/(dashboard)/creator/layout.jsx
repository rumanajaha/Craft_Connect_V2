"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AIUsageProvider, useAIUsage } from "@/lib/aiUsageStore";
import { CollabProvider } from "@/lib/collabStore";
import UpgradeModal from "@/components/brand/UpgradeModal";
import { useRealtime } from "@/context/RealtimeProvider";
import {
  LayoutDashboard,
  User,
  Sparkles,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Bell,
  Rss
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/creator", icon: LayoutDashboard },
  { label: "For You", href: "/creator/feed", icon: Rss },
  { label: "Profile Settings", href: "/creator/settings", icon: User },
  { label: "AI Studio", href: "/creator/ai-studio", icon: Sparkles },
  { label: "Messages", href: "/creator/messages", icon: MessageSquare },
];

function getPageTitle(pathname) {
  if (pathname === "/creator") return "Dashboard";
  if (pathname?.startsWith("/creator/feed")) return "For You";
  if (pathname?.startsWith("/creator/settings")) return "Profile Settings";
  if (pathname?.startsWith("/creator/profile")) return "Public Profile";
  if (pathname?.startsWith("/creator/ai-studio")) return "AI Studio";
  if (pathname?.startsWith("/creator/messages")) return "Messages";
  if (pathname?.startsWith("/creator/notifications")) return "Notifications";
  return "CraftConnect";
}

function Sidebar({ pathname, onClose }) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-brand-border/40">
      
      <div className="px-6 py-5 border-b border-brand-border/40 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-bold text-brand-dark hover:text-brand-primary transition-colors">
          CraftConnect<span className="text-brand-primary">.</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-brand-muted hover:text-brand-dark">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      
      <div className="px-6 py-3 border-b border-brand-border/40 flex items-center gap-2">
        <span className="inline-block px-2.5 py-1 bg-violet-100 text-violet-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-violet-200">
          Creator
        </span>
      </div>

      
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/creator" && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
                  : "text-brand-muted hover:text-brand-dark hover:bg-brand-border/30"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      
      <div className="px-3 py-4 border-t border-brand-border/40">
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-muted hover:text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Log Out
        </Link>
      </div>
    </div>
  );
}

export default function CreatorLayout({ children }) {
  return (
    <CollabProvider>
      <AIUsageProvider>
        <CreatorLayoutInner>{children}</CreatorLayoutInner>
      </AIUsageProvider>
    </CollabProvider>
  );
}

function CreatorLayoutInner({ children }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = getPageTitle(pathname);
  const { showUpgradeModal, setShowUpgradeModal } = useAIUsage();
  const { unreadCount } = useRealtime();
  const [avatarUrl, setAvatarUrl] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80");

  React.useEffect(() => {
    async function loadAvatar() {
      try {
        const res = await fetch("/api/creator/profile");
        if (res.ok) {
          const data = await res.json();
          if (data?.profile?.avatar_url || data?.profile?.avatar) {
            setAvatarUrl(data.profile.avatar_url || data.profile.avatar);
          }
        }
      } catch (err) {
        console.error("Failed to load layout avatar", err);
      }
    }
    loadAvatar();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex">
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      
      <aside className="hidden lg:flex flex-col w-56 shrink-0 fixed inset-y-0 left-0 z-30">
        <Sidebar pathname={pathname} />
      </aside>

      
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-50 w-56 flex flex-col shadow-xl">
            <Sidebar pathname={pathname} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">

        
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-brand-border/40">
          <div className="flex items-center justify-between px-5 py-3.5 max-w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden text-brand-muted hover:text-brand-dark transition-colors"
                aria-label="Open navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="font-serif text-lg font-bold text-brand-dark lg:hidden">
                CraftConnect<span className="text-brand-primary">.</span>
              </span>
              <h2 className="hidden lg:block text-sm font-semibold text-brand-muted tracking-wide">
                {pageTitle}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/creator/notifications"
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-brand-muted hover:text-brand-dark hover:bg-brand-border/30 transition-all"
                aria-label="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <Link href="/creator/profile" title="View profile">
                <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-brand-border/50 hover:border-brand-primary transition-colors bg-white">
                  <Image
                    src={avatarUrl}
                    alt="Creator Profile"
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                </div>
              </Link>
            </div>
          </div>
        </header>

        
        <main className="flex-1 p-6 md:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
