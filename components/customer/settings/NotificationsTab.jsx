import React, { useState, useEffect } from "react";
import { Bell, X, CheckCircle, Mail, Monitor } from "lucide-react";
import Button from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function Card({ className, children }) {
  return <div className={className}>{children}</div>;
}

function ToggleSwitch({ on, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-pressed={on}
      className={`relative inline-flex h-[22px] w-10 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${on ? "bg-brand-primary" : "bg-brand-border"}`}
    >
      <span
        className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          on ? "translate-x-[18px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function NotifRow({ label, desc, emailOn, desktopOn, onToggleEmail, onToggleDesktop }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-dark">{label}</p>
        <p className="text-xs text-brand-muted mt-0.5">{desc}</p>
      </div>
      <div className="flex items-center gap-8 pr-1">
        <div className="w-16 flex justify-center">
          <ToggleSwitch on={emailOn} onClick={onToggleEmail} />
        </div>
        <div className="w-16 flex justify-center">
          <ToggleSwitch on={desktopOn} onClick={onToggleDesktop} />
        </div>
      </div>
    </div>
  );
}

export default function NotificationsTab({ notifications, setNotifications, setIsDirty }) {
  const [pushDismissed, setPushDismissed] = useState(false);
  const [pushPermission, setPushPermission] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );
  const [userEmail, setUserEmail] = useState("alex@example.com");

  useEffect(() => {
    async function loadEmail() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setUserEmail(user.email);
      } catch (_) {}
    }
    loadEmail();
  }, []);

  const handleToggleNotification = (key, channel) => {
    setNotifications(prev => ({
      ...prev,
      [key]: { ...prev[key], [channel]: !prev[key][channel] },
    }));
    setIsDirty(true);
  };

  const allDesktopOn = Object.keys(notifications)
    .filter(k => k !== "securityAlerts")
    .every(k => notifications[k].desktop);

  const handleToggleAllDesktop = () => {
    const newVal = !allDesktopOn;
    setNotifications(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k !== "securityAlerts") next[k] = { ...next[k], desktop: newVal };
      });
      return next;
    });
    setIsDirty(true);
  };

  const handleRequestPush = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPushPermission(result);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {!pushDismissed && pushPermission !== "granted" && (
        <div className="bg-white border border-brand-border/50 shadow-sm rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-5 h-5 text-brand-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-dark">Allow push notifications</p>
            <p className="text-xs text-brand-muted mt-0.5 leading-relaxed">
              {pushPermission === "denied"
                ? "Push notifications are blocked in your browser settings. Enable them in your browser's site permissions."
                : "Get real-time updates in your browser for new messages and brand responses."
              }
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {pushPermission !== "denied" && (
              <Button variant="primary" size="sm" onClick={handleRequestPush}>
                Enable
              </Button>
            )}
            <button
              onClick={() => setPushDismissed(true)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-brand-muted hover:bg-brand-border/30 hover:text-brand-dark transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {pushPermission === "granted" && !pushDismissed && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs font-semibold text-emerald-700 flex-1">Push notifications are enabled for this device.</p>
          <button onClick={() => setPushDismissed(true)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Card className="bg-white border border-brand-border/50 shadow-sm rounded-2xl overflow-hidden">
        <div className="flex items-end justify-between px-6 py-4 border-b border-brand-border/30">
          <div>
            <h3 className="font-serif text-base font-bold text-brand-dark">Notifications</h3>
            <p className="text-xs text-brand-muted mt-0.5">Manage when and how you receive notifications.</p>
          </div>
          <div className="flex items-center gap-8 pr-1">
            <div className="flex flex-col items-center gap-1 w-16">
              <Mail className="w-4 h-4 text-brand-muted" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-brand-muted">Email</span>
              <span className="text-[9px] text-brand-muted truncate max-w-[72px] text-center" title={userEmail}>
                {userEmail.split("@")[0]}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 w-16">
              <Monitor className="w-4 h-4 text-brand-muted" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-brand-muted">Desktop</span>
              <button
                onClick={handleToggleAllDesktop}
                className="text-[9px] font-semibold text-brand-primary hover:underline"
              >
                {allDesktopOn ? "Disable all" : "Enable all"}
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-brand-border/20">
          <div className="px-6 pt-5 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">
              Requests &amp; Messages
            </span>
          </div>

          {[
            { key: "newMessage",    label: "New message from a brand",          desc: "When a brand sends you a message in your inbox." },
            { key: "brandResponse", label: "Brand responded to my request",      desc: "When a brand replies to one of your custom requests." },
            { key: "requestStatus", label: "Request status changed",             desc: "When your request is accepted or declined by a brand." },
          ].map(({ key, label, desc }) => (
            <NotifRow
              key={key}
              label={label}
              desc={desc}
              emailOn={notifications[key].email}
              desktopOn={notifications[key].desktop}
              onToggleEmail={() => handleToggleNotification(key, "email")}
              onToggleDesktop={() => handleToggleNotification(key, "desktop")}
            />
          ))}

          <div className="px-6 pt-5 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">
              Recommendations
            </span>
          </div>

          {[
            { key: "newRecommended", label: "New recommended brands available",  desc: "When new brands match your discovery preferences." },
            { key: "weeklyDigest",   label: "Weekly recommended-brands digest",  desc: "A curated weekly email of brands matching your taste." },
          ].map(({ key, label, desc }) => (
            <NotifRow
              key={key}
              label={label}
              desc={desc}
              emailOn={notifications[key].email}
              desktopOn={notifications[key].desktop}
              onToggleEmail={() => handleToggleNotification(key, "email")}
              onToggleDesktop={() => handleToggleNotification(key, "desktop")}
            />
          ))}

          <div className="px-6 pt-5 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">
              Account
            </span>
          </div>

          <div className="flex items-center gap-4 px-6 py-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-dark">Security alerts</p>
              <p className="text-xs text-brand-muted mt-0.5">New login detected or password changed on your account.</p>
            </div>
            <div className="flex items-center gap-8 pr-1">
              <div className="w-16 flex justify-center">
                <ToggleSwitch on={notifications.securityAlerts.email} disabled />
              </div>
              <div className="w-16 flex justify-center">
                <span className="text-[10px] text-brand-muted font-medium italic">Email only</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
