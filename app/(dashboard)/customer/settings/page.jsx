"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

import ProfileTab from "@/components/customer/settings/ProfileTab";
import SecurityTab from "@/components/customer/settings/SecurityTab";
import NotificationsTab from "@/components/customer/settings/NotificationsTab";

const DEFAULT_NOTIFICATIONS = {
  newMessage: { email: true, desktop: true },
  brandResponse: { email: true, desktop: true },
  requestStatus: { email: false, desktop: false },
  newRecommended: { email: false, desktop: false },
  weeklyDigest: { email: true, desktop: false },
  securityAlerts: { email: true, desktop: false },
};

const EMPTY_PROFILE = {
  fullName: "",
  phone: "",
  location: "",
  avatarUrl: null,
  email: "",
  role: "CUSTOMER",
};

export default function CustomerSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [memberSince, setMemberSince] = useState("—");
  const [stats, setStats] = useState({
    savedBrands: 0,
    activeRequests: 0,
    totalMessages: 0,
  });

  const [initialProfile, setInitialProfile] = useState(EMPTY_PROFILE);
  const [profile, setProfile] = useState(EMPTY_PROFILE);

  const [initialNotifications, setInitialNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);

  const [isDirtyOverride, setIsDirtyOverride] = useState(false);
  const [globalSaving, setGlobalSaving] = useState(false);
  const [globalSuccess, setGlobalSuccess] = useState("");
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/customer/profile");
        if (!res.ok) {
          throw new Error("Failed to load profile settings");
        }
        const data = await res.json();
        const loadedProfile = {
          fullName: data.fullName || "",
          phone: data.phone || "",
          location: data.location || "",
          avatarUrl: data.avatarUrl || null,
          email: data.email || "",
          role: data.role || "CUSTOMER",
        };
        const loadedNotifs = {
          ...DEFAULT_NOTIFICATIONS,
          ...(data.notificationPrefs || {}),
        };

        setInitialProfile(loadedProfile);
        setProfile(loadedProfile);
        setInitialNotifications(JSON.parse(JSON.stringify(loadedNotifs)));
        setNotifications(JSON.parse(JSON.stringify(loadedNotifs)));

        if (data.memberSince) {
          setMemberSince(
            new Date(data.memberSince).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          );
        }
        if (data.stats) {
          setStats({
            savedBrands: data.stats.savedBrands ?? 0,
            activeRequests: data.stats.activeRequests ?? 0,
            totalMessages: data.stats.totalMessages ?? 0,
          });
        }
      } catch (err) {
        console.error("Failed to load customer settings:", err);
        setGlobalError("Could not load your settings. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const isDirty =
    isDirtyOverride ||
    profile.fullName !== initialProfile.fullName ||
    profile.phone !== initialProfile.phone ||
    profile.location !== initialProfile.location ||
    profile.avatarUrl !== initialProfile.avatarUrl ||
    Object.keys(notifications).some(
      (k) =>
        notifications[k]?.email !== initialNotifications[k]?.email ||
        notifications[k]?.desktop !== initialNotifications[k]?.desktop
    );

  const handleSaveAllChanges = async () => {
    if (!isDirty || globalSaving) return;
    setGlobalSaving(true);
    setGlobalSuccess("");
    setGlobalError("");

    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profile.fullName,
          phone: profile.phone,
          location: profile.location,
          avatarUrl: profile.avatarUrl,
          notificationPrefs: notifications,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save changes");
      }

      const savedProfile = {
        fullName: data.fullName || "",
        phone: data.phone || "",
        location: data.location || "",
        avatarUrl: data.avatarUrl || null,
        email: data.email || profile.email,
        role: data.role || profile.role,
      };
      const savedNotifs = {
        ...DEFAULT_NOTIFICATIONS,
        ...(data.notificationPrefs || notifications),
      };

      setInitialProfile(savedProfile);
      setProfile(savedProfile);
      setInitialNotifications(JSON.parse(JSON.stringify(savedNotifs)));
      setNotifications(JSON.parse(JSON.stringify(savedNotifs)));
      if (data.stats) setStats(data.stats);
      setIsDirtyOverride(false);
      setGlobalSuccess("Settings updated successfully!");
    } catch (err) {
      console.error("Failed to save customer settings:", err);
      setGlobalError(err.message || "Failed to save changes.");
    } finally {
      setGlobalSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <div className="sticky top-0 bg-[#FAF7F0] z-20 py-4 border-b border-brand-border/30 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-dark">Settings</h1>
          <p className="text-brand-muted text-sm mt-1">Manage your account, security settings, and notifications.</p>
        </div>
        <div className="flex items-center gap-3">
          {globalError && (
            <span className="text-xs font-semibold text-red-600">{globalError}</span>
          )}
          {globalSuccess && (
            <span className="text-xs font-semibold text-emerald-600 animate-fade-in">
              ✓ {globalSuccess}
            </span>
          )}
          <Button
            variant="primary"
            disabled={!isDirty || globalSaving || loading}
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
          { id: "notifications", label: "Notifications" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setGlobalSuccess("");
              setGlobalError("");
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

      {loading ? (
        <div className="py-16 flex items-center justify-center text-sm text-brand-muted gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading settings…
        </div>
      ) : (
        <div className="mt-6">
          {activeTab === "profile" && (
            <ProfileTab
              profile={profile}
              setProfile={setProfile}
              setIsDirty={setIsDirtyOverride}
              createdAt={memberSince}
              stats={stats}
            />
          )}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "notifications" && (
            <NotificationsTab
              notifications={notifications}
              setNotifications={setNotifications}
              setIsDirty={setIsDirtyOverride}
              userEmail={profile.email}
            />
          )}
        </div>
      )}
    </div>
  );
}
