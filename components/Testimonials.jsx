"use client";

import React from "react";
import { Quote, Sparkles } from "lucide-react";
import Image from "next/image";

const TESTIMONIALS_ROW1 = [
  {
    id: 1,
    quote: "CraftConnect completely bypassed standard commercial feel. We found three editorial stylists who matched our raw wood aesthetic perfectly. Direct traffic to our Shopify increased by 40%.",
    author: "Klaus Soren",
    role: "Founder, Soren Objects",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    quote: "As a visual storyteller, it was hard finding brands that value slow-made processes over fast volume. Designing reels for Ochre Clay was an incredibly organic alignment.",
    author: "Elena Rostova",
    role: "Still-life Stylist",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: 3,
    quote: "The AI tools are so refined. The Brand Story generator helped us describe our kiln processes in a poetic way that standard copywriters could never capture. An essential tool for makers.",
    author: "Aki Tanaka",
    role: "Studio Lead, Ochre Clay",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: 4,
    quote: "We don't pay 15% marketplace commissions anymore. CraftConnect lets customers discover us directly and check out on our own store. It keeps our margins healthy and sustainable.",
    author: "Clara Sienna",
    role: "Formulator, Sienna Botanicals",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
  }
];

const TESTIMONIALS_ROW2 = [
  {
    id: 5,
    quote: "The platform's design matches our brand values. It is elegant, quiet, and feels like a gallery. We get clean, high-intent inquiries from creators who want to shoot our brass kettle collections.",
    author: "Liam Aurora",
    role: "Co-founder, Aurora Metalsmith",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: 6,
    quote: "It's refreshing to work with a platform that values aesthetics over spammy widgets. CraftConnect feels premium and tailored for high-end designers. Seamless, inspiring connections.",
    author: "Marcus Loom",
    role: "Lead Weaver, Studio Loom",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: 7,
    quote: "I've styled campaigns for massive ecommerce brands, but working with these small independent studios on CraftConnect is far more creative. The stories feel authentic and real.",
    author: "Sarah Jin",
    role: "Art Director & Curator",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: 8,
    quote: "The direct-to-maker link model is perfect. Consumers buy directly from us, meaning they support our studio completely. We've established partnerships that continue to flourish.",
    author: "Sophia Zephyr",
    role: "Designer, Zephyr Glass",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80"
  }
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-[#FAF7F0]/40 overflow-hidden relative select-none">
      <div className="mx-auto max-w-7xl px-6 md:px-12 mb-16">
        
        
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TESTIMONIALS</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-brand-dark mb-4">
            Artisan Voices
          </h2>
          <p className="text-brand-muted text-sm md:text-base">
            Read what makers and visual creators say about direct collaborations.
          </p>
        </div>

      </div>

      
      <div className="relative flex overflow-x-hidden w-full mb-8">
        <div className="flex whitespace-nowrap animate-marquee gap-8">
          {TESTIMONIALS_ROW1.concat(TESTIMONIALS_ROW1).map((t, idx) => (
            <div
              key={idx}
              className="inline-block whitespace-normal w-[350px] md:w-[450px] glass bg-white p-6 md:p-8 rounded-[24px] border border-brand-border/40 shadow-sm shrink-0"
            >
              <Quote className="w-8 h-8 text-brand-accent/50 mb-4 fill-brand-accent/10" />
              <p className="text-sm md:text-base text-brand-dark leading-relaxed mb-6 font-sans">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-brand-border">
                  <Image
                    src={t.avatar}
                    alt={t.author}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-xs text-brand-dark">{t.author}</h4>
                  <p className="text-[10px] text-brand-muted mt-0.5">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-cream to-transparent pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-cream to-transparent pointer-events-none" />
      </div>

      
      <div className="relative flex overflow-x-hidden w-full">
        <div className="flex whitespace-nowrap animate-marquee-reverse gap-8">
          {TESTIMONIALS_ROW2.concat(TESTIMONIALS_ROW2).map((t, idx) => (
            <div
              key={idx}
              className="inline-block whitespace-normal w-[350px] md:w-[450px] glass bg-white p-6 md:p-8 rounded-[24px] border border-brand-border/40 shadow-sm shrink-0"
            >
              <Quote className="w-8 h-8 text-brand-accent/50 mb-4 fill-brand-accent/10" />
              <p className="text-sm md:text-base text-brand-dark leading-relaxed mb-6 font-sans">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-brand-border">
                  <Image
                    src={t.avatar}
                    alt={t.author}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-xs text-brand-dark">{t.author}</h4>
                  <p className="text-[10px] text-brand-muted mt-0.5">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-cream to-transparent pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-cream to-transparent pointer-events-none" />
      </div>

    </section>
  );
}
