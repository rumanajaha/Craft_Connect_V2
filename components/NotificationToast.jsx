"use client";
import React, { useEffect } from "react";
import { X, Bell } from "lucide-react";
import { useRealtime } from "@/context/RealtimeProvider";

export default function NotificationToast() {
  const { toast, dismissToast } = useRealtime();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast) return null;

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes ring {
          0%, 100% { transform: rotate(0); }
          10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
          20%, 40%, 60%, 80% { transform: rotate(10deg); }
        }
        .animate-slide-in {
          animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-ring {
          animation: ring 1.5s ease-in-out infinite;
        }
      `}</style>
      <div className="fixed top-4 right-4 z-50 animate-slide-in max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-brand-border/40 p-4 flex gap-3 pointer-events-auto">
        <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
          <Bell className="w-4.5 h-4.5 text-brand-primary animate-ring" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-brand-dark leading-tight">
            {toast.title || "New Notification"}
          </h4>
          <p className="text-xs text-brand-muted mt-1 leading-relaxed line-clamp-2">
            {toast.body || ""}
          </p>
        </div>
        <button 
          onClick={dismissToast}
          className="text-brand-muted hover:text-brand-dark transition-colors h-fit self-start"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
