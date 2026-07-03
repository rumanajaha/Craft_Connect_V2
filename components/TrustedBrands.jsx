"use client";

import React from "react";
import { Star } from "lucide-react";

const BRANDS = [
  "SIENNA CLAY",
  "AETHER BOTANICALS",
  "STUDIO LOOM",
  "SOREN OBJECTS",
  "KOMOREBI STUDIO",
  "GAEA WEAVES",
  "AURORA METALSMITH",
  "NOMAD LINEN",
  "ZEPHYR SCENTS",
];

export default function TrustedBrands() {
  return (
    <section className="py-12 border-y border-brand-border/60 bg-white/30 overflow-hidden select-none">
      <div className="w-full text-center mb-6">
        <p className="text-[10px] uppercase font-bold tracking-widest text-brand-muted">
          ENABLING HIGH-ESTHETIC COLLABORATIONS ACROSS MODERN CRAFT STUDIOS
        </p>
      </div>

      {/* Marquee wrapper */}
      <div className="relative flex overflow-x-hidden w-full">
        {/* Infinite scrolling row */}
        <div className="flex whitespace-nowrap animate-marquee py-2 gap-12 items-center">
          {BRANDS.concat(BRANDS).map((brand, idx) => (
            <div key={idx} className="flex items-center gap-12">
              <span className="font-serif text-2xl md:text-3xl font-bold tracking-widest text-brand-dark/40 hover:text-brand-primary transition-colors cursor-default">
                {brand}
              </span>
              <Star className="w-4 h-4 text-brand-secondary fill-brand-secondary/30" />
            </div>
          ))}
        </div>

        {/* Shadow Overlays to fade margins */}
        <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-cream to-transparent pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-cream to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
