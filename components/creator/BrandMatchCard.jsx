"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Send } from "lucide-react";

export default function BrandMatchCard({ brand, onPitch }) {
  const [imgError, setImgError] = useState(false);
  const score = brand.matchPercent ?? brand.compatibility ?? 0;
  const showLogo = Boolean(brand?.logo) && !imgError;
  const initial = (brand?.name?.trim()?.[0] || "B").toUpperCase();

  const getCompColor = (s) => {
    if (s >= 90) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (s >= 80) return "text-brand-primary bg-brand-primary/10 border-brand-primary/30";
    return "text-blue-600 bg-blue-50 border-blue-200";
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 items-start sm:items-center bg-white border border-brand-border/50 rounded-2xl hover:border-brand-primary/30 hover:shadow-sm transition-all">
      <div className="flex items-center gap-4 w-full sm:w-1/3 shrink-0">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-brand-border/40 shrink-0 bg-brand-primary/10 flex items-center justify-center">
          {showLogo ? (
            <Image
              src={brand.logo}
              alt={brand.name || "Brand"}
              fill
              className="object-cover"
              unoptimized
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="font-serif text-lg font-bold text-brand-primary">
              {initial}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-brand-dark truncate">{brand.name}</p>
          <p className="text-xs text-brand-muted font-medium truncate">
            {[brand.category, brand.location].filter(Boolean).join(" · ") || "Independent Brand"}
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-start sm:justify-center">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${getCompColor(score)}`}>
          <span className="text-xs font-bold">{score}% Match</span>
        </div>
      </div>

      <div className="flex items-center w-full sm:w-auto shrink-0 justify-end">
        <button
          onClick={() => onPitch?.(brand)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors shadow-sm shadow-brand-primary/20"
        >
          <Send className="w-3.5 h-3.5" /> Pitch
        </button>
      </div>
    </div>
  );
}
