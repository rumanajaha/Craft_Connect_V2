import React, { useState } from "react";
import { Mail, Monitor } from "lucide-react";

const NotifToggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-[22px] w-10 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? "bg-brand-primary" : "bg-brand-border"
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? "translate-x-[18px]" : "translate-x-0"
      }`}
    />
  </button>
);

export default function NotificationsTab({ setIsDirty }) {
  const [notifications, setNotifications] = useState({
    newPitch: { email: true, desktop: true },
    newRequest: { email: true, desktop: true },
    aiMatch: { email: false, desktop: true },
    messages: { email: true, desktop: true }
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white border border-brand-border/50 shadow-sm rounded-2xl overflow-hidden">
        
        {/* Table header */}
        <div className="flex items-end justify-between px-6 py-5 border-b border-brand-border/30">
          <div>
            <h3 className="font-serif text-base font-bold text-brand-dark">Brand Notifications</h3>
            <p className="text-xs text-brand-muted mt-0.5">Control which alerts you receive about your brand activity.</p>
          </div>
          <div className="flex items-center gap-8 pr-1 shrink-0">
            <div className="flex flex-col items-center gap-1 w-16">
              <Mail className="w-4 h-4 text-brand-muted" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-brand-muted">Email</span>
            </div>
            <div className="flex flex-col items-center gap-1 w-16">
              <Monitor className="w-4 h-4 text-brand-muted" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-brand-muted">Push</span>
            </div>
          </div>
        </div>

        {/* Notification rows */}
        <div className="divide-y divide-brand-border/20">
          {[
            { key: "newPitch", label: "Creator Pitches", desc: "When a creator requests to collaborate with your brand." },
            { key: "newRequest", label: "Customer Requests", desc: "When a customer submits a custom product request." },
            { key: "aiMatch", label: "AI Matches", desc: "When our AI finds a highly compatible creator for you." },
            { key: "messages", label: "Direct Messages", desc: "Replies from customers or creators in your inbox." }
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-4 px-6 py-4 hover:bg-brand-border/5 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-dark">{item.label}</p>
                <p className="text-xs text-brand-muted mt-0.5">{item.desc}</p>
              </div>
              <div className="flex items-center gap-8 pr-1 shrink-0">
                <div className="w-16 flex justify-center">
                  <NotifToggle 
                    checked={notifications[item.key].email} 
                    onChange={() => {
                      setNotifications(prev => ({ ...prev, [item.key]: { ...prev[item.key], email: !prev[item.key].email } }));
                      setIsDirty(true);
                    }}
                  />
                </div>
                <div className="w-16 flex justify-center">
                  <NotifToggle 
                    checked={notifications[item.key].desktop} 
                    onChange={() => {
                      setNotifications(prev => ({ ...prev, [item.key]: { ...prev[item.key], desktop: !prev[item.key].desktop } }));
                      setIsDirty(true);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
