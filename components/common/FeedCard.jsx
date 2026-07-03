"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Heart, Bookmark, Eye, CornerDownRight, ExternalLink } from "lucide-react";

export default function FeedCard({ item, viewerRole }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  // Helper to format date
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval}y ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}mo ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;
    return "just now";
  };

  // Determine brand profile link depending on role
  const getBrandLink = (brandId) => {
    if (viewerRole === "brand") return "/brand/profile";
    return `/customer/brand/${brandId}`;
  };

  // Render Product Card
  const renderProduct = () => (
    <div className="flex flex-col bg-white rounded-3xl border border-brand-border/40 overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="relative w-full h-64 bg-brand-border/10">
        <Image 
          src={item.image} 
          alt={item.name} 
          fill 
          sizes="(max-width: 768px) 100vw, 40vw"
          className="object-cover transition-transform duration-500 hover:scale-103"
        />
        {item.reason && (
          <div className="absolute top-4 left-4 bg-brand-primary/95 text-white backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3 h-3" /> {item.reason}
          </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-4 mb-2">
            <h3 className="font-serif text-lg font-bold text-brand-dark leading-snug line-clamp-1">
              {item.name}
            </h3>
            <span className="text-base font-bold text-brand-primary">${item.price}</span>
          </div>

          <div className="flex items-center gap-2.5 mb-4">
            <div className="relative w-6 h-6 rounded-full overflow-hidden border border-brand-border/40 shrink-0 bg-white">
              <Image src={item.brandLogo} alt={item.brandName} fill className="object-cover" />
            </div>
            <Link 
              href={getBrandLink(item.brandId)} 
              className="text-xs font-semibold text-brand-dark hover:text-brand-primary hover:underline transition-all"
            >
              {item.brandName}
            </Link>
          </div>
        </div>

        <div className="pt-4 border-t border-brand-border/30 flex items-center justify-between">
          <div className="flex gap-2">
            <button 
              onClick={() => setLiked(!liked)} 
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                liked 
                  ? "bg-red-50 border-red-200 text-red-500" 
                  : "bg-white border-brand-border/40 text-brand-muted hover:text-brand-dark hover:bg-brand-border/20"
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
            </button>
            <button 
              onClick={() => setSaved(!saved)} 
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                saved 
                  ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary" 
                  : "bg-white border-brand-border/40 text-brand-muted hover:text-brand-dark hover:bg-brand-border/20"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
            </button>
          </div>

          <Link 
            href={getBrandLink(item.brandId)} 
            className="text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors inline-flex items-center gap-1"
          >
            View Brand Profile <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );

  // Render Brand Profile Update Card
  const renderBrandUpdate = () => (
    <div className="flex flex-col bg-white rounded-3xl border border-brand-border/40 p-6 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-brand-border/40 shrink-0 bg-white">
            <Image src={item.brandLogo} alt={item.brandName} fill className="object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-brand-dark">{item.brandName}</h4>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 uppercase tracking-wider">
                Update
              </span>
            </div>
            <p className="text-[10px] text-brand-muted mt-0.5">{formatTimeAgo(item.created_at)}</p>
          </div>
        </div>

        {item.reason && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-2.5 h-2.5" /> {item.reason}
          </div>
        )}
      </div>

      <div className="bg-brand-border/10 rounded-2xl p-4 mb-4 border border-brand-border/30">
        <p className="text-sm text-brand-dark leading-relaxed font-serif">
          {item.updateText}
        </p>
      </div>

      <div className="flex justify-between items-center pt-2">
        <div className="flex gap-2">
          <button 
            onClick={() => setLiked(!liked)} 
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
              liked 
                ? "bg-red-50 border-red-200 text-red-500" 
                : "bg-white border-brand-border/40 text-brand-muted hover:text-brand-dark hover:bg-brand-border/20"
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
          </button>
        </div>
        
        <Link 
          href={getBrandLink(item.brandId)} 
          className="text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors inline-flex items-center gap-1.5"
        >
          Explore Studio <CornerDownRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );

  // Render Creator Content Card
  const renderCreatorContent = () => (
    <div className="flex flex-col bg-white rounded-3xl border border-brand-border/40 overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="p-5 flex items-center justify-between gap-4 border-b border-brand-border/20">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-brand-border/40 shrink-0 bg-white">
            <Image src={item.creatorAvatar} alt={item.creatorName} fill className="object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-brand-dark">{item.creatorName}</h4>
              <span className="text-[9px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100 uppercase tracking-wider">
                Creator
              </span>
            </div>
            <p className="text-[10px] text-brand-muted">{formatTimeAgo(item.created_at)}</p>
          </div>
        </div>

        {item.reason && (
          <div className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-2.5 h-2.5" /> {item.reason}
          </div>
        )}
      </div>

      <div className="relative w-full h-52 bg-brand-border/10">
        <Image 
          src={item.portfolioImage} 
          alt={item.caption} 
          fill 
          sizes="(max-width: 768px) 100vw, 40vw"
          className="object-cover"
        />
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <p className="text-xs text-brand-dark/95 leading-relaxed italic mb-4">
          &ldquo;{item.caption}&rdquo;
        </p>

        <div className="pt-4 border-t border-brand-border/30 flex items-center justify-between">
          <div className="flex gap-4 text-brand-muted text-xs font-medium">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> {item.views.toLocaleString()}
            </span>
          </div>

          <Link 
            href="/creator/profile" 
            className="text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors inline-flex items-center gap-1"
          >
            View Portfolio <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );

  switch (item.type) {
    case "product":
      return renderProduct();
    case "brand_update":
      return renderBrandUpdate();
    case "creator_content":
      return renderCreatorContent();
    default:
      return null;
  }
}
