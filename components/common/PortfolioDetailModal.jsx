"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Eye, Sparkles, FolderOpen, Heart } from "lucide-react";

export default function PortfolioDetailModal({ item, isOpen, onClose }) {
  const [localViews, setLocalViews] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!isOpen || !item?.id) return;

    const baseViews = item.view_count || item.views || 0;
    const storageKey = `viewed_portfolio_${item.id}`;
    const alreadyViewed = sessionStorage.getItem(storageKey);

    if (!alreadyViewed) {
      sessionStorage.setItem(storageKey, "true");
      setLocalViews(baseViews + 1);

      fetch("/api/track-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "portfolio", itemId: item.id }),
      }).catch(err => {
        console.error("Failed to track view for portfolio:", item.id, err);
      });
    } else {
      setLocalViews(baseViews);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const title = item.title || item.brandName || "Portfolio Work";
  const imageSrc = item.media_url || item.image || item.portfolioImage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header (Title and Close Button) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/40 shrink-0">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-brand-primary" />
            <h2 className="font-serif text-lg font-bold text-brand-dark">
              Portfolio Project Details
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-brand-muted hover:text-brand-dark transition-colors p-1 rounded-full hover:bg-brand-border/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Media Section */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-brand-border/20 border border-brand-border/40 shadow-inner">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-brand-muted text-sm gap-2">
                <FolderOpen className="w-10 h-10 opacity-30" />
                <span>No Project Image</span>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                  Collaboration Project
                </p>
                <h3 className="font-serif text-xl font-bold text-brand-dark mt-1">
                  For {title}
                </h3>
              </div>

              {/* Interaction views & likes */}
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-border/20 text-brand-dark rounded-xl text-xs font-semibold">
                  <Eye className="w-4 h-4 text-brand-muted" />
                  {localViews.toLocaleString()} Views
                </span>
                <button
                  onClick={() => setLiked(!liked)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold transition-all ${
                    liked 
                      ? "bg-red-50 border-red-200 text-red-500 shadow-sm"
                      : "bg-white border-brand-border/40 text-brand-muted hover:text-brand-dark"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                  {liked ? "Liked!" : "Like"}
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="bg-brand-border/10 rounded-2xl p-5 border border-brand-border/30">
              <p className="text-sm text-brand-dark leading-relaxed font-sans whitespace-pre-wrap">
                {item.description || "No project description provided."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer info/attribution */}
        {item.createdAt && (
          <div className="px-6 py-4 bg-brand-border/10 border-t border-brand-border/30 shrink-0 flex items-center justify-between text-[11px] text-brand-muted font-medium">
            <span>Published {new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> Handcrafted Collaboration</span>
          </div>
        )}
      </div>
    </div>
  );
}
