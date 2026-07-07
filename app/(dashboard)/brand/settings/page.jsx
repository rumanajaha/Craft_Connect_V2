"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import { Save, Loader2, ExternalLink } from "lucide-react";
import { useBrandData } from "@/lib/brandDataStore";
import { useAIUsage } from "@/lib/aiUsageStore";

import ProfileTab from "@/components/brand/settings/ProfileTab";
import SecurityTab from "@/components/brand/settings/SecurityTab";
import NotificationsTab from "@/components/brand/settings/NotificationsTab";


const TabButton = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
      active
        ? "border-brand-primary text-brand-primary"
        : "border-transparent text-brand-muted hover:text-brand-dark hover:border-brand-border/80"
    }`}
  >
    {children}
  </button>
);

export default function BrandSettingsPage() {
  const { brandInfo, setBrandInfo } = useBrandData();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  
  const [profile, setProfile] = useState({
    name: brandInfo.name,
    category: brandInfo.category,
    location: brandInfo.location,
    website: brandInfo.website,
    videoUrl: brandInfo.videoUrl,
    description: brandInfo.description,
    tags: brandInfo.tags,
    instagram: brandInfo.instagram,
    tiktok: brandInfo.tiktok,
    rating: 4.9,
    reviews: 42
  });

  useEffect(() => {
    setProfile(p => ({
      ...p,
      name: brandInfo.name,
      category: brandInfo.category,
      location: brandInfo.location,
      website: brandInfo.website,
      videoUrl: brandInfo.videoUrl,
      description: brandInfo.description,
      tags: brandInfo.tags,
      instagram: brandInfo.instagram,
      tiktok: brandInfo.tiktok,
    }));
  }, [brandInfo]);

  const { isPro } = useAIUsage();

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setBrandInfo(profile);
      setIsSaving(false);
      setIsDirty(false);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark flex flex-wrap items-center gap-3">
            <span>Profile Settings</span>
          {!isPro && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              Settings & Tools usage varies
            </span>
          )}
          </h1>
          <p className="text-brand-muted text-sm mt-1.5">
            Manage your brand identity, tags, and account preferences.
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          
          <Link
            href="/brand/profile"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border/60 bg-white text-sm font-semibold text-brand-dark hover:border-brand-primary/50 hover:text-brand-primary transition-all shadow-sm whitespace-nowrap"
          >
            <ExternalLink className="w-4 h-4" />
            Preview public profile
          </Link>

          
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="shadow-sm shadow-brand-primary/20 whitespace-nowrap"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save all changes</>
            )}
          </Button>
        </div>
      </div>

      
      <div className="flex items-center gap-2 border-b border-brand-border/50 overflow-x-auto hide-scrollbar">
        <TabButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")}>
          Brand Profile
        </TabButton>
        <TabButton active={activeTab === "security"} onClick={() => setActiveTab("security")}>
          Security
        </TabButton>
        <TabButton active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")}>
          Notifications
        </TabButton>
      </div>

      
      <div className="pt-2">
        {activeTab === "profile" && (
          <ProfileTab 
            profile={profile} 
            setProfile={setProfile} 
            setIsDirty={setIsDirty} 
          />
        )}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "notifications" && <NotificationsTab setIsDirty={setIsDirty} />}
      </div>
    </div>
  );
}
