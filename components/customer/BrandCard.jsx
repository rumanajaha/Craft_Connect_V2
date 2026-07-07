"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import Button from "@/components/ui/button";

export default function BrandCard({ brand, isSaved = false, onToggleSave, compact = false }) {
  return (
    <div className="group bg-white rounded-2xl border border-brand-border/50 shadow-sm hover:shadow-md hover:border-brand-primary/20 transition-all duration-300 overflow-hidden flex flex-col">
      
      <div className="relative h-32 w-full overflow-hidden bg-brand-border/20">
        <Image
          src={brand.logo}
          alt={brand.name}
          fill
          sizes="(max-width: 640px) 100vw, 300px"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
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
        
        <div className="absolute bottom-2 left-2 px-2.5 py-0.5 bg-white/90 backdrop-blur rounded-full text-[9px] font-bold tracking-widest uppercase text-brand-dark">
          {brand.category}
        </div>
      </div>

      
      <div className="p-4 flex flex-col gap-3 flex-grow">
        <div>
          <h3 className="font-serif text-base font-bold text-brand-dark group-hover:text-brand-primary transition-colors leading-tight">
            {brand.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin className="w-3 h-3 text-brand-muted shrink-0" />
            <span className="text-[11px] text-brand-muted">{brand.location}</span>
          </div>
        </div>

        
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(i => (
              <Star
                key={i}
                className={`w-3 h-3 ${i <= Math.floor(brand.rating) ? "text-amber-400 fill-amber-400" : "text-brand-border"}`}
              />
            ))}
          </div>
          <span className="text-[11px] font-semibold text-brand-dark">{brand.rating}</span>
          <span className="text-[10px] text-brand-muted">({brand.reviewsCount})</span>
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
