"use client";

import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";

const COLLECTIONS = [
  {
    id: 1,
    name: "The Ceramicist's Table",
    tag: "CURATED CAPSULE",
    count: "14 Brands",
    image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&auto=format&fit=crop&q=80",
    description: "Raw stoneware, tactile glazes, and wood-fired ceramics for the slow dinner table.",
    link: "#"
  },
  {
    id: 2,
    name: "Slow-Stitched Living",
    tag: "LIMITED EDITION",
    count: "9 Brands",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80",
    description: "Handloomed Belgian linen, organic cotton block prints, and natural indigo dyed items.",
    link: "#"
  },
  {
    id: 3,
    name: "Botanical Apothecary",
    tag: "ORGANIC RAW",
    count: "18 Brands",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&auto=format&fit=crop&q=80",
    description: "Cold-pressed apothecary items, herbal oils, and wild-harvested forest perfumes.",
    link: "#"
  },
  {
    id: 4,
    name: "Modern Minimal Woods",
    tag: "STUDIO MADE",
    count: "11 Brands",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
    description: "Solid walnut carvings, hand-planed benches, and oak kitchen tools from local trees.",
    link: "#"
  }
];

export default function FeaturedCollections() {
  return (
    <section className="py-24 px-6 md:px-12 bg-white relative">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SEASONAL ARCHIVES</span>
          </div>
          <h2 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-brand-dark mb-6">
            Featured Collections
          </h2>
          <p className="text-brand-muted text-base md:text-lg leading-relaxed">
            Curated seasonal archives showcasing projects created by collaborative craft collectives.
          </p>
        </div>

        {/* Collection Grid: 4-Column Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {COLLECTIONS.map((col) => (
            <div
              key={col.id}
              className="group cursor-pointer flex flex-col h-full"
            >
              {/* Image box with static aspect ratio */}
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-sm mb-4 border border-brand-border/40 bg-cream">
                <Image
                  src={col.image}
                  alt={col.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-103"
                />
                
                {/* Floating details */}
                <div className="absolute top-4 left-4">
                  <span className="glass px-2.5 py-1 rounded-full text-[8px] font-bold text-brand-dark uppercase tracking-widest">
                    {col.tag}
                  </span>
                </div>
                
                <div className="absolute top-4 right-4">
                  <span className="bg-brand-dark/80 text-cream backdrop-blur-md px-2.5 py-1 rounded-full text-[8px] font-bold tracking-widest uppercase">
                    {col.count}
                  </span>
                </div>
              </div>

              {/* Text Info */}
              <div className="px-1 flex flex-col justify-between flex-grow">
                <div>
                  <div className="flex items-start justify-between gap-2 group-hover:text-brand-primary transition-colors">
                    <h3 className="font-serif text-lg font-bold text-brand-dark group-hover:text-brand-primary transition-colors leading-snug">
                      {col.name}
                    </h3>
                    <div className="w-6 h-6 rounded-full border border-brand-border flex items-center justify-center text-brand-dark group-hover:border-brand-primary group-hover:bg-brand-primary group-hover:text-cream transition-all duration-300 shrink-0 mt-0.5">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                    {col.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
