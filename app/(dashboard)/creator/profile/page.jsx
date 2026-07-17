"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, ExternalLink, Instagram, Youtube, Users, Activity, Eye } from "lucide-react";
import PortfolioDetailModal from "@/components/common/PortfolioDetailModal";

export default function CreatorPublicProfilePage() {
  const [creator, setCreator] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    async function fetchProfileData() {
      try {
        setLoading(true);
        setError(null);
        
        const profileRes = await fetch("/api/creator/profile");
        if (!profileRes.ok) {
          throw new Error("Failed to load creator profile");
        }
        const profileData = await profileRes.json();

        const portfolioRes = await fetch("/api/creator/portfolio");
        if (!portfolioRes.ok) {
          throw new Error("Failed to load creator portfolio");
        }
        const portfolioData = await portfolioRes.json();

        setCreator(profileData.profile);
        setPortfolio(portfolioData.portfolio || []);
      } catch (err) {
        console.error("Error fetching creator profile:", err);
        setError(err.message || "Failed to load profile details.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfileData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        <p className="text-brand-muted text-sm mt-3 font-semibold">Loading profile...</p>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
        <h3 className="font-serif font-bold text-red-800 text-lg mb-2">Error Loading Profile</h3>
        <p className="text-sm text-red-600 mb-4">{error || "Could not retrieve creator profile."}</p>
        <Link href="/creator/settings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary bg-brand-primary/10 px-4 py-2 rounded-xl hover:bg-brand-primary/20 transition-colors">
          Go to Settings
        </Link>
      </div>
    );
  }

  const creatorName = creator.display_name || creator.displayName || "Anonymous Creator";
  const creatorAvatar = creator.avatar_url || creator.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";
  const nichesList = typeof creator.niches === "string" 
    ? creator.niches.split(",").map(n => n.trim()).filter(Boolean) 
    : (creator.niches || []);
  const tagsList = creator.tags 
    ? creator.tags.split(",").map(t => t.trim()).filter(Boolean) 
    : [];


  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      <div className="relative w-full h-52 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-primary/20 to-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        
        <div className="absolute bottom-4 left-5 flex items-end gap-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-white">
            <Image src={creatorAvatar} alt={creatorName} fill sizes="80px" className="object-cover" />
          </div>
          <div className="pb-1">
            <h1 className="font-serif text-2xl font-bold text-white leading-tight drop-shadow-sm">{creatorName}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-white/90">
              <span className="text-sm font-medium">{creator.location || ''}</span>
            </div>
          </div>
        </div>
      </div>

      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-brand-border/50 rounded-full shadow-sm">
            <Users className="w-4 h-4 text-brand-primary" />
            <span className="text-sm font-bold text-brand-dark">{(creator.followers || creator.follower_count || 0).toLocaleString()}</span>
            <span className="text-xs text-brand-muted">Followers</span>
          </div>

          
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full shadow-sm">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700">{creator.engagementRate || creator.engagement_rate || 0}% Engagement</span>
          </div>

          
          <div className="flex items-center gap-2">
            <a href={`https://instagram.com/${creator.instagram || creator.instagram_url || ''}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white border border-brand-border/50 flex items-center justify-center text-brand-muted hover:text-brand-primary hover:border-brand-primary/50 transition-colors shadow-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href={`https://tiktok.com/@${creator.tiktok || creator.tiktok_url || ''}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white border border-brand-border/50 flex items-center justify-center text-brand-muted hover:text-black hover:border-black/50 transition-colors shadow-sm">
              <svg className="w-4 h-4 fill-current stroke-none" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.28 0 .54.04.8.1V9.01a6.27 6.27 0 0 0-.8-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.8a8.18 8.18 0 0 0 4.77 1.53V6.87a4.83 4.83 0 0 1-1.01-.18Z"/></svg>
            </a>
            <a href={`https://youtube.com/@${creator.youtube || creator.youtube_url || ''}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white border border-brand-border/50 flex items-center justify-center text-brand-muted hover:text-red-500 hover:border-red-500/50 transition-colors shadow-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </a>
          </div>
        </div>

        <div>
          <Link href="/creator/settings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary bg-brand-primary/10 px-4 py-2 rounded-xl hover:bg-brand-primary/20 transition-colors">
            Edit Profile
          </Link>
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-brand-border/50 p-6 shadow-sm">
        <h2 className="font-serif text-lg font-bold text-brand-dark mb-3">About {creatorName.split(' ')[0]}</h2>
        <p className="text-sm text-brand-dark/90 leading-relaxed whitespace-pre-wrap max-w-3xl">
          {creator.bio || ''}
        </p>

        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-brand-border/40">
          {nichesList.map(niche => (
            <span key={niche} className="text-xs font-bold uppercase tracking-wider text-brand-dark bg-brand-border/20 px-2.5 py-1 rounded-full">
              {niche}
            </span>
          ))}
          {tagsList.map(tag => (
            <span key={tag} className="text-xs font-semibold text-brand-muted bg-brand-border/10 px-2.5 py-1 rounded-full border border-brand-border/30">
              #{tag}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-brand-dark">Portfolio & Recent Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {portfolio.map(item => (
            <div 
              key={item.id} 
              onClick={() => { setSelectedItem(item); setIsDetailOpen(true); }}
              className="group flex flex-col bg-white rounded-2xl border border-brand-border/50 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="relative w-full h-48 bg-brand-border/20">
                {item.image ? <Image src={item.image} alt={item.brandName || item.title || ''} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized /> : <div className="w-full h-full bg-brand-border/30 flex items-center justify-center text-brand-muted text-xs">No Image</div>}
              </div>
              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <p className="text-xs text-brand-primary font-bold uppercase tracking-wider mb-1">For {item.brandName || item.title || 'Project'}</p>
                  <p className="text-sm text-brand-dark leading-relaxed line-clamp-2">{item.description}</p>
                </div>
                {item.view_count !== undefined && (
                  <div className="flex items-center gap-1 mt-3 text-xs text-brand-muted font-medium">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{(item.view_count || 0).toLocaleString()} views</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <PortfolioDetailModal
        item={selectedItem}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
