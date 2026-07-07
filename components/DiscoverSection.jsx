"use client";

import React from "react";
import { Sparkles, Heart } from "lucide-react";
import Image from "next/image";

const DISCOVER_ITEMS = [
  {
    id: 1,
    title: "The Fire & Earth Collection",
    brand: "Ochre Clay Studio",
    category: "Ceramics",
    image: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&auto=format&fit=crop&q=80",
    likes: 423,
    type: "story",
    description: "From mud to form — our pottery takes weeks to cure in custom wood-fired kilns."
  },
  {
    id: 2,
    title: "Raw Cedarwood & Jojoba",
    brand: "Sienna Botanicals",
    category: "Apothecary",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&auto=format&fit=crop&q=80",
    likes: 218,
    type: "product",
    description: "Cold-pressed apothecary items sourced from organic family woodlands."
  },
  {
    id: 3,
    title: "Behind the Chisel Studio Reel",
    brand: "Soren Objects",
    category: "Woodwork",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    likes: 672,
    type: "video",
    description: "A short documentary following Soren's morning ritual of hand-carving elm stools."
  },
  {
    id: 4,
    title: "Belgian Flax Handloomed Rugs",
    brand: "Gaea Weaves",
    category: "Textiles",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80",
    likes: 350,
    type: "collection",
    description: "Centuries-old weaving techniques translated into contemporary floor tapestry."
  },
  {
    id: 5,
    title: "Hammered Brass Kettle Series",
    brand: "Aurora Metalsmith",
    category: "Metalware",
    image: "https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=600&auto=format&fit=crop&q=80",
    likes: 189,
    type: "product",
    description: "Individually hammered solid brass kettles built to last generations."
  },
  {
    id: 6,
    title: "Wild Bee Honeycomb Candle",
    brand: "Aether Scents",
    category: "Apothecary",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80",
    likes: 512,
    type: "product",
    description: "Pure beeswax candles mixed with local lavender extracts."
  },
  {
    id: 7,
    title: "Pendant Lights of Blown Glass",
    brand: "Zephyr Glass",
    category: "Lighting",
    image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&auto=format&fit=crop&q=80",
    likes: 290,
    type: "story",
    description: "Stained handblown glasses casting sunset refraction shadows."
  },
  {
    id: 8,
    title: "Minimalist Stoneware Bowls",
    brand: "Ochre Clay Studio",
    category: "Ceramics",
    image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&auto=format&fit=crop&q=80",
    likes: 405,
    type: "collection",
    description: "A capsule dinnerware series for slow-living tables."
  }
];

export default function DiscoverSection() {
  return (
    <section id="discover" className="py-24 px-6 md:px-12 bg-[#FAF7F0]/40 relative">
      <div className="mx-auto max-w-7xl">
        
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curated Inspiration</span>
            </div>
            <h2 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-brand-dark leading-tight">
              Discover Independent <br />
              <span className="italic font-normal text-brand-primary">Handcrafted Stories</span>
            </h2>
          </div>
          <p className="text-brand-muted max-w-sm text-sm md:text-base leading-relaxed">
            Browse through active brand profiles. Meet local makers and explore their design aesthetics for future collaborations.
          </p>
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {DISCOVER_ITEMS.map((item) => (
            <div
              key={item.id}
              className="relative rounded-2xl overflow-hidden group bg-white border border-brand-border/60 flex flex-col h-full shadow-sm hover:border-brand-primary/30 transition-all duration-300"
            >
              
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream border-b border-brand-border/40">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-103"
                />
                
                
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-bold text-brand-muted tracking-wider uppercase shadow-sm">
                  {item.category}
                </div>
              </div>

              
              <div className="p-5 flex flex-col justify-between flex-grow">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-brand-primary uppercase block mb-1">
                    {item.brand}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-brand-dark leading-snug mb-2 group-hover:text-brand-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-brand-muted leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-brand-border/40 pt-4 mt-4 text-[10px] font-bold text-brand-muted tracking-wider">
                  <span className="uppercase">{item.type}</span>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-brand-primary fill-brand-primary/10" />
                    <span>{item.likes}</span>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
