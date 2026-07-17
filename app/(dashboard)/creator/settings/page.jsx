"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Save, ShieldAlert, Bell, Check, Loader2, Mail, Monitor, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import PortfolioItem from "@/components/creator/PortfolioItem";

export default function CreatorProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const fileInputRef = useRef(null);
  const projectFileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    displayName: "",
    bio: "",
    niches: "",
    followers: 0,
    engagementRate: 0,
    tags: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    avatar: "",
  });

  const [portfolio, setPortfolio] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Add Portfolio Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState({ brandName: "", description: "", image: "" });
  const [isAddingProject, setIsAddingProject] = useState(false);

  // Security (password change) States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState({
    brandMatchFound: { email: true, desktop: true },
    pitchResponse: { email: true, desktop: true },
    newMessage: { email: true, desktop: true },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/creator/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile({
            id: data.profile.id,
            displayName: data.profile.displayName || "",
            bio: data.profile.bio || "",
            niches: data.profile.niches || "",
            followers: data.profile.followers || 0,
            engagementRate: data.profile.engagementRate || 0,
            tags: data.profile.tags || "",
            instagram: data.profile.instagram || "",
            tiktok: data.profile.tiktok || "",
            youtube: data.profile.youtube || "",
            avatar: data.profile.avatar || "",
          });
          if (data.profile.notification_prefs) {
            setNotifPrefs(data.profile.notification_prefs);
          }
        } else if (response.status === 401) {
          window.location.href = "/login";
        }

        // Fetch portfolio items
        const portfolioRes = await fetch("/api/creator/portfolio");
        if (portfolioRes.ok) {
          const portfolioData = await portfolioRes.json();
          setPortfolio(portfolioData.portfolio || []);
        }
      } catch (err) {
        console.error("Failed to load creator profile / portfolio data:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    fetchData();
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/creator/profile/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(prev => ({
          ...prev,
          avatar: data.avatarUrl
        }));
      } else {
        alert(data.error || "Failed to upload image.");
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
      alert("Error uploading avatar.");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/creator/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          notification_prefs: notifPrefs
        })
      });
      if (response.ok) {
        const data = await response.json();
        setProfile({
          id: data.profile.id,
          displayName: data.profile.displayName || "",
          bio: data.profile.bio || "",
          niches: data.profile.niches || "",
          followers: data.profile.followers || 0,
          engagementRate: data.profile.engagementRate || 0,
          tags: data.profile.tags || "",
          instagram: data.profile.instagram || "",
          tiktok: data.profile.tiktok || "",
          youtube: data.profile.youtube || "",
          avatar: data.profile.avatar || "",
        });
        if (data.profile.notification_prefs) {
          setNotifPrefs(data.profile.notification_prefs);
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(`Failed to save settings: ${errData.error || response.statusText || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Save settings error:", err);
      alert("Error saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProjectImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/creator/portfolio/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setNewProject(prev => ({ ...prev, image: data.url }));
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image");
    }
  };

  const handleAddProject = async () => {
    if (!newProject.brandName) {
      alert("Please enter a Brand Name / Title.");
      return;
    }
    setIsAddingProject(true);
    try {
      const res = await fetch("/api/creator/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject)
      });
      if (res.ok) {
        const data = await res.json();
        setPortfolio(prev => [data.portfolioItem, ...prev]);
        setShowAddModal(false);
        setNewProject({ brandName: "", description: "", image: "" });
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to add portfolio item");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding portfolio item");
    } finally {
      setIsAddingProject(false);
    }
  };

  const handleRemovePortfolioItem = async (id) => {
    if (!confirm("Are you sure you want to delete this portfolio item?")) return;
    try {
      const res = await fetch(`/api/creator/portfolio/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setPortfolio(prev => prev.filter(p => p.id !== id));
      } else {
        alert("Failed to delete portfolio item.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting portfolio item.");
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const response = await fetch("/api/auth/security/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (response.ok) {
        setPasswordUpdated(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordUpdated(false), 3000);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update password.");
      }
    } catch (err) {
      console.error("Password update error:", err);
      alert("An error occurred while updating the password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const TABS = [
    { id: "profile", label: "Profile" },
    { id: "security", label: "Security" },
    { id: "notifications", label: "Notifications" },
  ];

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-brand-border/50 max-w-5xl mx-auto">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary mr-2" />
        <span className="text-sm font-semibold text-brand-muted">Loading profile settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark">Profile Settings</h1>
          <p className="text-brand-muted text-sm mt-1.5">Manage your creator identity and preferences.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/creator/profile"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border/60 bg-white text-sm font-semibold text-brand-dark hover:border-brand-primary/50 hover:text-brand-primary transition-all shadow-sm whitespace-nowrap"
          >
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            Preview public profile
          </Link>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex gap-1 bg-brand-border/20 p-1 rounded-xl w-fit max-w-full overflow-x-auto scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-white text-brand-dark shadow-sm"
                : "text-brand-muted hover:text-brand-dark"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Identity */}
          <Card className="p-6">
            <div className="flex items-center gap-6">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                style={{ display: "none" }} 
                accept="image/*" 
              />
              <div 
                onClick={triggerFileInput}
                className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-brand-border/50 bg-white shrink-0 cursor-pointer group"
              >
                <Image 
                  src={profile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} 
                  alt="Avatar" 
                  fill 
                  className="object-cover" 
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <Input label="Display Name" name="displayName" value={profile.displayName} onChange={handleProfileChange} />
              </div>
            </div>
          </Card>

          {/* About */}
          <Card className="p-6 space-y-5">
            <h3 className="font-serif font-bold text-brand-dark text-lg">About You</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Biography</label>
              <textarea
                name="bio"
                rows={4}
                value={profile.bio}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark resize-none"
              />
            </div>
            <Input label="Niches (comma-separated)" name="niches" value={profile.niches} onChange={handleProfileChange} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Follower Count" name="followers" type="number" value={profile.followers} onChange={handleProfileChange} />
              <div>
                <Input label="Engagement Rate (%)" name="engagementRate" type="number" step="0.1" value={profile.engagementRate} onChange={handleProfileChange} />
                <p className="text-[10px] text-brand-muted mt-1">Feeds the AI matching algorithm for brand compatibility.</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">AI Recommendation Tags</label>
              <input
                name="tags"
                value={profile.tags}
                onChange={handleProfileChange}
                placeholder="slow living, home decor, ceramics..."
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark"
              />
              <p className="text-[10px] text-brand-muted">These tags are used by the AI to match you with compatible brands.</p>
            </div>
          </Card>

          {/* Socials */}
          <Card className="p-6 space-y-5">
            <h3 className="font-serif font-bold text-brand-dark text-lg">Social Channels</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                <Input label="Instagram" name="instagram" value={profile.instagram} onChange={handleProfileChange} className="flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-muted shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.28 0 .54.04.8.1V9.01a6.27 6.27 0 0 0-.8-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.8a8.18 8.18 0 0 0 4.77 1.53V6.87a4.83 4.83 0 0 1-1.01-.18Z"/></svg>
                <Input label="TikTok" name="tiktok" value={profile.tiktok} onChange={handleProfileChange} className="flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                <Input label="YouTube" name="youtube" value={profile.youtube} onChange={handleProfileChange} className="flex-1" />
              </div>
            </div>
          </Card>

          {/* Portfolio */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-brand-dark text-lg">Portfolio</h3>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAddModal(true)}
                  className="text-brand-dark border-brand-border flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Project
                </Button>
                <p className="text-xs text-brand-muted">{portfolio.length} project{portfolio.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolio.map(item => (
                <PortfolioItem
                  key={item.id}
                  item={item}
                  onRemove={handleRemovePortfolioItem}
                />
              ))}
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : saved ? <Check className="w-4 h-4 mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
              {isSaving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="bg-white rounded-2xl border border-brand-border/50 p-6 animate-in fade-in duration-300">
          <h3 className="font-serif text-lg font-bold text-brand-dark mb-1">Password & Security</h3>
          <p className="text-xs text-brand-muted mb-6">Update your password to keep your creator account secure.</p>
          
          <div className="space-y-4 max-w-md">
            <Input type="password" label="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
            <Input type="password" label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
            <Input type="password" label="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            <Button 
              variant="outline" 
              className={`mt-2 ${passwordUpdated ? "border-emerald-500 text-emerald-700 hover:bg-emerald-50" : "text-brand-dark"}`} 
              onClick={handlePasswordUpdate}
              disabled={isUpdatingPassword || !newPassword || !confirmPassword}
            >
              {isUpdatingPassword ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
              ) : passwordUpdated ? (
                <><Check className="w-4 h-4 mr-2" /> Password Updated</>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-white border border-brand-border/50 shadow-sm rounded-2xl overflow-hidden">
            <div className="flex items-end justify-between px-6 py-5 border-b border-brand-border/30">
              <div>
                <h3 className="font-serif text-base font-bold text-brand-dark">Notification Preferences</h3>
                <p className="text-xs text-brand-muted mt-0.5">Control which alerts you receive about your creator activity.</p>
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

            <div className="divide-y divide-brand-border/20">
              {[
                { key: "brandMatchFound", label: "New brand match found", desc: "Get notified when AI finds a compatible brand for you." },
                { key: "pitchResponse", label: "Brand responded to my pitch", desc: "Get notified when a brand accepts or declines your pitch." },
                { key: "newMessage", label: "New message received", desc: "Get notified when a brand sends you a message." },
              ].map(pref => {
                const Toggle = ({ checked, onChange }) => (
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

                return (
                  <div key={pref.key} className="flex items-center gap-4 px-6 py-4 hover:bg-brand-border/5 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-brand-dark">{pref.label}</p>
                      <p className="text-xs text-brand-muted mt-0.5">{pref.desc}</p>
                    </div>
                    <div className="flex items-center gap-8 pr-1 shrink-0">
                      <div className="w-16 flex justify-center">
                        <Toggle 
                          checked={notifPrefs[pref.key]?.email ?? true} 
                          onChange={() => setNotifPrefs(prev => ({
                            ...prev,
                            [pref.key]: { ...prev[pref.key], email: !(prev[pref.key]?.email ?? true) }
                          }))}
                        />
                      </div>
                      <div className="w-16 flex justify-center">
                        <Toggle 
                          checked={notifPrefs[pref.key]?.desktop ?? true} 
                          onChange={() => setNotifPrefs(prev => ({
                            ...prev,
                            [pref.key]: { ...prev[pref.key], desktop: !(prev[pref.key]?.desktop ?? true) }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : saved ? <Check className="w-4 h-4 mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
              {isSaving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
            </Button>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-brand-border/80 shadow-2xl p-6 animate-in zoom-in-95 duration-200 relative text-left">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-brand-muted hover:text-brand-dark transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>
            <h4 className="font-serif text-xl font-bold text-brand-dark mb-4">Add Portfolio Project</h4>
            <div className="space-y-4">
              <input 
                type="file" 
                ref={projectFileInputRef} 
                onChange={handleProjectImageUpload} 
                style={{ display: "none" }} 
                accept="image/*" 
              />
              
              <div className="flex flex-col items-center gap-3">
                <label className="text-xs font-bold text-brand-dark uppercase tracking-wider self-start">Project Image</label>
                <div 
                  onClick={() => projectFileInputRef.current?.click()}
                  className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-brand-border/50 bg-brand-border/10 cursor-pointer group flex items-center justify-center"
                >
                  {newProject.image ? (
                    <Image src={newProject.image} alt="Project Image" fill className="object-cover" />
                  ) : (
                    <div className="text-center text-brand-muted flex flex-col items-center gap-1.5">
                      <Camera className="w-8 h-8 opacity-40" />
                      <span className="text-xs font-semibold">Upload cover photo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white mb-1" />
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Upload new</span>
                  </div>
                </div>
              </div>

              <Input 
                label="Brand Name / Project Title" 
                value={newProject.brandName} 
                onChange={e => setNewProject(prev => ({ ...prev, brandName: e.target.value }))}
                placeholder="e.g. Ochre Clay Studio"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Project Description</label>
                <textarea
                  rows={3}
                  value={newProject.description}
                  onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Instagram reel campaign with slow living aesthetics..."
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                className="text-brand-dark border-brand-border"
                onClick={() => setShowAddModal(false)}
                disabled={isAddingProject}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddProject}
                disabled={!newProject.brandName || isAddingProject}
                variant="primary"
              >
                {isAddingProject ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
                {isAddingProject ? "Adding..." : "Add Project"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
