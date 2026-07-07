"use client";

import React from "react";
import { motion } from "framer-motion";
import { Hammer, Users, ShoppingBag, ArrowUpRight, Sparkles, Check } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      title: "Handmade Brands",
      icon: Hammer,
      headline: "Showcase Your Craft",
      points: [
        "Create an editorial, media-rich brand profile.",
        "Use AI to generate captivating workshop stories.",
        "List seasonal collections for creator matching.",
        "Direct verified customer traffic to your own website."
      ],
      badge: "CREATE",
      cta: "Build Brand Profile",
      color: "border-brand-primary/45"
    },
    {
      id: 2,
      title: "Creative Creators",
      icon: Users,
      headline: "Collaborate & Stylize",
      points: [
        "Discover and apply for authentic brand campaigns.",
        "Receive physical handcrafted items for styling.",
        "Upload photography and reels to the platform.",
        "Earn brand deals and grow your design portfolio."
      ],
      badge: "COLLAB",
      cta: "Become a Partner",
      color: "border-brand-secondary/45"
    },
    {
      id: 3,
      title: "Aesthetic Customers",
      icon: ShoppingBag,
      headline: "Discover & Buy Direct",
      points: [
        "Browse the curated visual inspiration masonry.",
        "Read deep brand histories and meet studio makers.",
        "No platform markups — click through to buy direct.",
        "Support local, independent, high-end craftsmen."
      ],
      badge: "DISCOVER",
      cta: "Start Exploring",
      color: "border-brand-accent/60"
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 md:px-12 bg-cream relative">
      
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-accent/15 blur-3xl -z-10" />

      <div className="mx-auto max-w-7xl">
        
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HOW CRAFTCONNECT WORKS</span>
          </div>
          <h2 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-brand-dark mb-6">
            Connecting the Ecosystem
          </h2>
          <p className="text-brand-muted text-base md:text-lg leading-relaxed">
            We are not a marketplace. We do not charge sales commissions. We are the bridge connecting artisanal studios, aesthetic creators, and conscious shoppers.
          </p>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {steps.map((step, i) => {
            const Icon = step.icon;

            return (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                key={step.id}
                className={`glass bg-white p-8 md:p-10 rounded-[32px] flex flex-col justify-between shadow-sm border ${step.color} relative overflow-hidden`}
              >
                
                
                <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-brand-accent/20 blur-2xl group-hover:scale-150 transition-transform duration-700" />

                <div>
                  
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-cream flex items-center justify-center border border-brand-border text-brand-primary">
                      <Icon className="w-5.5 h-5.5" />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest text-brand-muted uppercase bg-cream border border-brand-border px-3 py-1 rounded-full">
                      {step.badge}
                    </span>
                  </div>

                  
                  <h3 className="font-serif text-xl font-bold text-brand-muted mb-1">{step.title}</h3>
                  <h4 className="font-serif text-2xl font-black text-brand-dark mb-6 leading-tight">
                    {step.headline}
                  </h4>

                  
                  <ul className="space-y-4 mb-10">
                    {step.points.map((pt, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                        <span className="text-sm md:text-base text-brand-muted leading-relaxed">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full inline-flex items-center justify-center gap-2 bg-brand-dark text-cream hover:bg-brand-primary font-medium text-sm py-4 rounded-full shadow-sm hover:shadow transition-colors"
                >
                  {step.cta}
                  <ArrowUpRight className="w-4 h-4" />
                </motion.button>

              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
