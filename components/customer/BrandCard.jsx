"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Bookmark, BookmarkCheck } from "lucide-react";
import Button from "@/components/ui/button";

export default function BrandCard({ brand, isSaved = false, onToggleSave, compact = false }) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(brand?.logo) && !imgError;
  const initial = (brand?.name?.trim()?.[0] || "B").toUpperCase();
  const rating = Number(brand?.rating ?? 0);
  const reviewCount = brand?.reviewCount ?? brand?.reviewsCount ?? 0;

  return (
    <div className="group bg-white rounded-2xl border border-brand-border/50 shadow-sm hover:shadow-md hover:border-brand-primary/20 transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative h-32 w-full overflow-hidden bg-brand-primary/10 flex items-center justify-center">
        {showImage ? (
          <Image
            src={brand.logo}
            alt={brand.name || "Brand"}
            fill
            sizes="(max-width: 640px) 100vw, 300px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-brand-primary/15 border border-brand-primary/20 flex items-center justify-center">
            <span className="font-serif text-2xl font-bold text-brand-primary">
              {initial}
            </span>
          </div>
        )}

        <button
          onClick={(e) => { e.preventDefault(); onToggleSave?.(brand.id); }}
          className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          aria-label={isSaved ? "Remove bookmark" : "Save brand"}
        >
          {isSaved
            ? <BookmarkCheck className="w-4 h-4 text-brand-primary" />
            : <Bookmark className="w-4 h-4 text-brand-muted" />
          }
        </button>

        {brand.category && (
          <div className="absolute bottom-2 left-2 px-2.5 py-0.5 bg-white/90 backdrop-blur rounded-full text-[9px] font-bold tracking-widest uppercase text-brand-dark">
            {brand.category}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-grow">
        <div>
          <h3 className="font-serif text-base font-bold text-brand-dark group-hover:text-brand-primary transition-colors leading-tight">
            {brand.name}
          </h3>
          {brand.location && (
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3 h-3 text-brand-muted shrink-0" />
              <span className="text-[11px] text-brand-muted">{brand.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${i <= Math.floor(rating) ? "text-amber-400 fill-amber-400" : "text-brand-border"}`}
              />
            ))}
          </div>
          <span className="text-[11px] font-semibold text-brand-dark">{rating.toFixed(1)}</span>
          <span className="text-[10px] text-brand-muted">({reviewCount})</span>
        </div>

        <div className="mt-auto">
          <Link href={`/customer/brand/${brand.id}`} className="block w-full">
            <Button variant="outline" size="sm" className="w-full text-xs">
              View Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
