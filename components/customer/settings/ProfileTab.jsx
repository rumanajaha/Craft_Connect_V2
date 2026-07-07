import React, { useState, useRef } from "react";
import Image from "next/image";
import { Award, Calendar } from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { MOCK_REQUESTS, MOCK_MESSAGES } from "@/lib/mockData";

function Card({ className, children }) {
  return <div className={className}>{children}</div>;
}

export default function ProfileTab({ profile, setProfile, setIsDirty, createdAt }) {
  const [avatar, setAvatar] = useState(null);
  const fileRef = useRef(null);

  const handleProfileChange = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
      setIsDirty(true);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    setIsDirty(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        
        <div className="col-span-12 md:col-span-4">
          <Card className="p-6 flex flex-col items-center text-center bg-white border border-brand-border/50 shadow-sm rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 mb-4 w-full text-left">
              Profile Picture
            </h3>
            <div className="relative w-28 h-28 rounded-full overflow-hidden bg-brand-border/20 border-2 border-white shadow-md mb-4 flex items-center justify-center">
              {avatar ? (
                <Image src={avatar} alt="Avatar preview" fill className="object-cover" />
              ) : (
                <span className="text-4xl font-serif font-bold text-brand-primary">
                  {profile.displayName ? profile.displayName[0].toUpperCase() : "C"}
                </span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            
            <div className="flex flex-col gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs text-brand-dark"
                onClick={() => fileRef.current?.click()}
              >
                Upload new photo
              </Button>
              {avatar && (
                <button
                  onClick={handleRemoveAvatar}
                  className="text-xs text-red-600 font-semibold hover:underline mt-1"
                >
                  Remove photo
                </button>
              )}
            </div>
            <p className="text-[10px] text-brand-muted mt-4">
              SVG, PNG or JPG. Max size 2MB.
            </p>
          </Card>
        </div>

        
        <div className="col-span-12 md:col-span-8">
          <Card className="p-6 bg-white border border-brand-border/50 shadow-sm rounded-2xl space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 pb-3 border-b border-brand-border/30">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="displayName"
                label="Full Name"
                value={profile.displayName}
                onChange={e => handleProfileChange("displayName", e.target.value)}
                required
              />
              <Input
                id="phone"
                label="Phone Number (optional)"
                value={profile.phone}
                onChange={e => handleProfileChange("phone", e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-sans font-semibold uppercase tracking-wider text-brand-dark/60 select-none">
                  Email Address
                </label>
                <div className="w-full px-4 py-3 rounded-2xl bg-brand-border/20 border border-brand-border/50 text-sm text-brand-muted cursor-not-allowed">
                  alex@example.com
                </div>
                <span className="text-[10px] text-brand-muted pl-1">
                  🔒 Email verification is required to edit address.
                </span>
              </div>
              <Input
                id="location"
                label="Location (City, State)"
                value={profile.location}
                onChange={e => handleProfileChange("location", e.target.value)}
                placeholder="e.g. Seattle, WA"
              />
            </div>
          </Card>
        </div>

      </div>

      
      <Card className="p-6 bg-white border border-brand-border/50 shadow-sm rounded-2xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 pb-3 border-b border-brand-border/30 mb-5">
          Account Overview
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <span className="text-[10px] text-brand-muted uppercase tracking-wider font-semibold block">Account Role</span>
              <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-brand-primary/15 text-brand-primary text-[10px] font-bold uppercase tracking-wider rounded-full">
                Customer
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <span className="text-[10px] text-brand-muted uppercase tracking-wider font-semibold block">Member Since</span>
              <span className="text-sm font-semibold text-brand-dark">{createdAt}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-border/30 pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-4">
            Activity Quick Stats
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#FAF7F0] border border-brand-border/40 rounded-2xl p-4 text-center">
              <p className="text-2xl font-serif font-bold text-brand-dark">3</p>
              <p className="text-[9px] text-brand-muted uppercase font-bold tracking-wider mt-1.5">Saved Brands</p>
            </div>
            <div className="bg-[#FAF7F0] border border-brand-border/40 rounded-2xl p-4 text-center">
              <p className="text-2xl font-serif font-bold text-brand-dark">
                {MOCK_REQUESTS.filter(r => r.status !== "closed").length}
              </p>
              <p className="text-[9px] text-brand-muted uppercase font-bold tracking-wider mt-1.5">Active Requests</p>
            </div>
            <div className="bg-[#FAF7F0] border border-brand-border/40 rounded-2xl p-4 text-center">
              <p className="text-2xl font-serif font-bold text-brand-dark">
                {MOCK_MESSAGES.reduce((acc, t) => acc + t.messages.length, 0)}
              </p>
              <p className="text-[9px] text-brand-muted uppercase font-bold tracking-wider mt-1.5">Total Messages</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
