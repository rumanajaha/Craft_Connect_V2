"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, ExternalLink, Instagram, Youtube, Users, Activity } from "lucide-react";
import { MOCK_ACTIVE_CREATOR, MOCK_CREATOR_PORTFOLIO } from "@/lib/mockData";

export default function CreatorPublicProfilePage() {
  const creator = MOCK_ACTIVE_CREATOR;
  const portfolio = MOCK_CREATOR_PORTFOLIO;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      <div className="relative w-full h-52 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-primary/20 to-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        
        <div className="absolute bottom-4 left-5 flex items-end gap-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-white">
            <Image src={creator.avatar} alt={creator.name} fill sizes="80px" className="object-cover" />
          </div>
          <div className="pb-1">
            <h1 className="font-serif text-2xl font-bold text-white leading-tight drop-shadow-sm">{creator.name}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-white/90">
              <span className="text-sm font-medium">{creator.location}</span>
            </div>
          </div>
        </div>
      </div>

      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-brand-border/50 rounded-full shadow-sm">
            <Users className="w-4 h-4 text-brand-primary" />
            <span className="text-sm font-bold text-brand-dark">{creator.followers.toLocaleString()}</span>
            <span className="text-xs text-brand-muted">Followers</span>
          </div>

          
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full shadow-sm">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700">{creator.engagementRate}% Engagement</span>
          </div>

          
          <div className="flex items-center gap-2">
            <a href={`https://instagram.com/${creator.instagram}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white border border-brand-border/50 flex items-center justify-center text-brand-muted hover:text-brand-primary hover:border-brand-primary/50 transition-colors shadow-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href={`https://tiktok.com/@${creator.tiktok}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white border border-brand-border/50 flex items-center justify-center text-brand-muted hover:text-black hover:border-black/50 transition-colors shadow-sm">
              <svg className="w-4 h-4 fill-current stroke-none" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.28 0 .54.04.8.1V9.01a6.27 6.27 0 0 0-.8-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.8a8.18 8.18 0 0 0 4.77 1.53V6.87a4.83 4.83 0 0 1-1.01-.18Z"/></svg>
            </a>
            <a href={`https://youtube.com/@${creator.youtube}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white border border-brand-border/50 flex items-center justify-center text-brand-muted hover:text-red-500 hover:border-red-500/50 transition-colors shadow-sm">
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
        <h2 className="font-serif text-lg font-bold text-brand-dark mb-3">About {creator.name.split(' ')[0]}</h2>
        <p className="text-sm text-brand-dark/90 leading-relaxed whitespace-pre-wrap max-w-3xl">
          {creator.bio}
        </p>

        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-brand-border/40">
          {creator.niches.map(niche => (
            <span key={niche} className="text-xs font-bold uppercase tracking-wider text-brand-dark bg-brand-border/20 px-2.5 py-1 rounded-full">
              {niche}
            </span>
          ))}
          {creator.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
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
            <div key={item.id} className="group flex flex-col bg-white rounded-2xl border border-brand-border/50 overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative w-full h-48 bg-brand-border/20">
                <Image src={item.image} alt={item.brandName} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-4 flex flex-col flex-1">
                <p className="text-xs text-brand-primary font-bold uppercase tracking-wider mb-1">For {item.brandName}</p>
                <p className="text-sm text-brand-dark leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
