"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import ProfileTab from "@/components/customer/settings/ProfileTab";
import SecurityTab from "@/components/customer/settings/SecurityTab";
import NotificationsTab from "@/components/customer/settings/NotificationsTab";

export default function CustomerSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [createdAt, setCreatedAt] = useState("July 2, 2026");
  
  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.created_at) {
          const date = new Date(user.created_at);
          setCreatedAt(
            date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })
          );
        }
      } catch (e) {
      }
    }
    loadUser();
  }, []);

  const [initialProfile, setInitialProfile] = useState({
    displayName: "Alex Customer",
    phone: "+1 (555) 0199",
    location: "Seattle, WA",
  });
  const [profile, setProfile] = useState({ ...initialProfile });

  const [initialNotifications, setInitialNotifications] = useState({
    newMessage:       { email: true,  desktop: true  },
    brandResponse:    { email: true,  desktop: true  },
    requestStatus:    { email: false, desktop: false },
    newRecommended:   { email: false, desktop: false },
    weeklyDigest:     { email: true,  desktop: false },
    securityAlerts:   { email: true,  desktop: false },
  });
  const [notifications, setNotifications] = useState(
    JSON.parse(JSON.stringify(initialNotifications))
  );

  const [isDirtyOverride, setIsDirtyOverride] = useState(false);
  const [globalSaving, setGlobalSaving] = useState(false);
  const [globalSuccess, setGlobalSuccess] = useState("");

  const isDirty =
    isDirtyOverride ||
    profile.displayName !== initialProfile.displayName ||
    profile.phone !== initialProfile.phone ||
    profile.location !== initialProfile.location ||
    Object.keys(notifications).some(
      k =>
        notifications[k].email   !== initialNotifications[k].email ||
        notifications[k].desktop !== initialNotifications[k].desktop
    );

  const handleSaveAllChanges = () => {
    if (!isDirty) return;
    setGlobalSaving(true);
    setGlobalSuccess("");

    setTimeout(() => {
      setInitialProfile({ ...profile });
      setInitialNotifications(JSON.parse(JSON.stringify(notifications)));
      setIsDirtyOverride(false);
      setGlobalSaving(false);
      setGlobalSuccess("Settings updated successfully!");
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      
      <div className="sticky top-0 bg-[#FAF7F0] z-20 py-4 border-b border-brand-border/30 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-dark">Settings</h1>
          <p className="text-brand-muted text-sm mt-1">Manage your account, security settings, and notifications.</p>
        </div>
        <div className="flex items-center gap-3">
          {globalSuccess && (
            <span className="text-xs font-semibold text-emerald-600 animate-fade-in">
              ✓ {globalSuccess}
            </span>
          )}
          <Button
            variant="primary"
            disabled={!isDirty || globalSaving}
            onClick={handleSaveAllChanges}
            className="flex items-center gap-2"
          >
            {globalSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save all changes</span>
          </Button>
        </div>
      </div>

      <div className="border-b border-brand-border/40 flex gap-6 overflow-x-auto scrollbar-none pb-px">
        {[
          { id: "profile", label: "Profile" },
          { id: "security", label: "Security" },
          { id: "notifications", label: "Notifications" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setGlobalSuccess("");
            }}
            className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all relative ${
              activeTab === tab.id
                ? "border-brand-primary text-brand-dark"
                : "border-transparent text-brand-muted hover:text-brand-dark"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "profile" && (
          <ProfileTab 
            profile={profile} 
            setProfile={setProfile} 
            setIsDirty={setIsDirtyOverride} 
            createdAt={createdAt} 
          />
        )}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "notifications" && (
          <NotificationsTab 
            notifications={notifications} 
            setNotifications={setNotifications} 
            setIsDirty={setIsDirtyOverride} 
          />
        )}
      </div>

    </div>
  );
}
