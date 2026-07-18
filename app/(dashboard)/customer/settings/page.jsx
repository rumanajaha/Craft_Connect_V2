"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

import ProfileTab from "@/components/customer/settings/ProfileTab";
import SecurityTab from "@/components/customer/settings/SecurityTab";
import NotificationsTab from "@/components/customer/settings/NotificationsTab";

const mapDbPrefsToUi = (dbPrefs) => {
  const defaults = {
    newMessage: { email: true, desktop: true },
    requestResponded: { email: true, desktop: true },
    requestStatusChanged: { email: false, desktop: false },
    newRecommendedBrands: { email: false, desktop: false },
    weeklyDigest: { email: true, desktop: false },
    securityAlerts: { email: true, desktop: true }
  };
  const prefs = { ...defaults, ...dbPrefs };
  return {
    newMessage: prefs.newMessage,
    brandResponse: prefs.requestResponded,
    requestStatus: prefs.requestStatusChanged,
    newRecommended: prefs.newRecommendedBrands,
    weeklyDigest: prefs.weeklyDigest,
    securityAlerts: prefs.securityAlerts
  };
};

const mapUiPrefsToDb = (uiPrefs) => {
  return {
    newMessage: uiPrefs.newMessage,
    requestResponded: uiPrefs.brandResponse,
    requestStatusChanged: uiPrefs.requestStatus,
    newRecommendedBrands: uiPrefs.newRecommended,
    weeklyDigest: uiPrefs.weeklyDigest,
    securityAlerts: uiPrefs.securityAlerts
  };
};

export default function CustomerSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [createdAt, setCreatedAt] = useState("July 2, 2026");
  const [loading, setLoading] = useState(true);

  const [initialProfile, setInitialProfile] = useState({
    displayName: "",
    phone: "",
    location: "",
    avatarUrl: "",
    email: "",
  });
  const [profile, setProfile] = useState({ ...initialProfile });
  const [stats, setStats] = useState({
    saved_brands_count: 0,
    active_requests_count: 0,
    total_messages_count: 0,
  });

  const [initialNotifications, setInitialNotifications] = useState({
    newMessage:       { email: true,  desktop: true  },
    brandResponse:    { email: true,  desktop: true  },
    requestStatus:    { email: false, desktop: false },
    newRecommended:   { email: false, desktop: false },
    weeklyDigest:     { email: true,  desktop: false },
    securityAlerts:   { email: true,  desktop: true },
  });
  const [notifications, setNotifications] = useState(
    JSON.parse(JSON.stringify(initialNotifications))
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/customer/profile");
        if (res.ok) {
          const data = await res.json();
          const p = data.profile || {};
          const loadedProfile = {
            displayName: p.displayName || "",
            phone: p.phone || "",
            location: p.location || "",
            avatarUrl: p.avatarUrl || "",
            email: p.email || "",
          };
          setInitialProfile(loadedProfile);
          setProfile({ ...loadedProfile });
          
          if (data.stats) {
            setStats(data.stats);
          }
          if (p.createdAt) {
            const date = new Date(p.createdAt);
            setCreatedAt(
              date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })
            );
          }
          if (p.notification_prefs) {
            const uiPrefs = mapDbPrefsToUi(p.notification_prefs);
            setInitialNotifications(uiPrefs);
            setNotifications(JSON.parse(JSON.stringify(uiPrefs)));
          }
        }
      } catch (err) {
        console.error("Failed to load customer profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const [isDirtyOverride, setIsDirtyOverride] = useState(false);
  const [globalSaving, setGlobalSaving] = useState(false);
  const [globalSuccess, setGlobalSuccess] = useState("");

  const isDirty =
    isDirtyOverride ||
    profile.displayName !== initialProfile.displayName ||
    profile.phone !== initialProfile.phone ||
    profile.location !== initialProfile.location ||
    profile.avatarUrl !== initialProfile.avatarUrl ||
    Object.keys(notifications).some(
      k =>
        notifications[k].email   !== initialNotifications[k].email ||
        notifications[k].desktop !== initialNotifications[k].desktop
    );

  const handleSaveAllChanges = async () => {
    if (!isDirty) return;
    setGlobalSaving(true);
    setGlobalSuccess("");

    try {
      const dbPrefs = mapUiPrefsToDb(notifications);

      const profileRes = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: profile.displayName,
          phone: profile.phone,
          location: profile.location,
          avatarUrl: profile.avatarUrl,
          notification_prefs: dbPrefs
        })
      });

      if (!profileRes.ok) {
        const errData = await profileRes.json();
        throw new Error(errData.error || "Failed to update profile settings");
      }

      const resData = await profileRes.json();
      const updatedProfile = {
        displayName: resData.profile?.displayName || profile.displayName,
        phone: resData.profile?.phone || profile.phone,
        location: resData.profile?.location || profile.location,
        avatarUrl: resData.profile?.avatarUrl || profile.avatarUrl,
        email: profile.email,
      };

      setInitialProfile(updatedProfile);
      setProfile({ ...updatedProfile });

      if (resData.profile?.notification_prefs) {
        const uiPrefs = mapDbPrefsToUi(resData.profile.notification_prefs);
        setInitialNotifications(uiPrefs);
        setNotifications(JSON.parse(JSON.stringify(uiPrefs)));
      }

      setIsDirtyOverride(false);
      setGlobalSuccess("Settings updated successfully!");
    } catch (err) {
      console.error("Error saving changes:", err);
      alert(err.message || "Something went wrong while saving changes");
    } finally {
      setGlobalSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-brand-muted text-sm font-semibold flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
          Loading settings...
        </div>
      </div>
    );
  }

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
            stats={stats} 
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
