"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";

export default function CreatorMatchCard({ creator }) {
  
  const getCompColor = (score) => {
    if (score >= 90) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 80) return "text-brand-primary bg-brand-primary/10 border-brand-primary/30";
    return "text-blue-600 bg-blue-50 border-blue-200";
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 items-start sm:items-center bg-white border border-brand-border/50 rounded-2xl hover:border-brand-primary/30 hover:shadow-sm transition-all">
      
      <div className="flex items-center gap-4 w-full sm:w-1/3 shrink-0">
        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-brand-border/40 shrink-0">
          <Image src={creator.avatar} alt={creator.name} fill className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-brand-dark truncate">{creator.name}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-brand-muted font-medium">{creator.followers} followers</span>
            <span className="text-xs text-brand-muted font-medium flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              {creator.engagementRate} ER
            </span>
          </div>
        </div>
      </div>

      
      <div className="flex-1 w-full min-w-0 flex flex-wrap gap-1.5">
        {creator.niches.map(niche => (
          <span key={niche} className="inline-block px-2.5 py-1 rounded-full bg-brand-border/20 text-brand-dark/80 text-[10px] font-bold uppercase tracking-wider">
            {niche}
          </span>
        ))}
      </div>

      
      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${getCompColor(creator.compatibility)}`}>
          <span className="text-xs font-bold">{creator.compatibility}% Match</span>
        </div>
        
        <Link 
          href={`/brand/creator/${creator.id}`} 
          className="flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors px-2 py-1"
        >
          View Profile <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
