"use client";

import React, { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { Award, Heart, MessageCircle, Star } from "lucide-react";

function Counter({ value, suffix = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString() + suffix);

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration: 2,
        ease: [0.16, 1, 0.3, 1],
      });
      return controls.stop;
    }
  }, [isInView, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export default function Statistics() {
  const stats = [
    {
      id: 1,
      name: "Handmade Brands",
      value: 540,
      suffix: "+",
      icon: Award,
      desc: "Verified studios listing high-end collections."
    },
    {
      id: 2,
      name: "Creator Collaborations",
      value: 12800,
      suffix: "+",
      icon: MessageCircle,
      desc: "Campaign stories launched and shared."
    },
    {
      id: 3,
      name: "Products Showcased",
      value: 85000,
      suffix: "+",
      icon: Star,
      desc: "Artisanal pieces curated for matching."
    },
    {
      id: 4,
      name: "Monthly Audience Reach",
      value: 4.8,
      suffix: "M+",
      icon: Heart,
      desc: "Aggregated social impressions and traffic.",
      isFloat: true 
    }
  ];

  return (
    <section className="py-24 px-6 md:px-12 bg-white border-y border-brand-border/60 relative overflow-hidden">
      
      <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl">
        
        
        <div className="max-w-2xl mb-16 text-left">
          <p className="text-[10px] uppercase font-bold tracking-widest text-brand-primary mb-3">
            COMMUNITY TRACTION
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-brand-dark">
            Our Growing Creative Network
          </h2>
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;

            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                key={stat.id}
                className="glass bg-[#FAF7F0]/20 p-8 rounded-3xl border border-brand-border/40 relative group hover:border-brand-primary/30 transition-all duration-300"
              >
                
                <div className="w-10 h-10 rounded-xl bg-white border border-brand-border flex items-center justify-center text-brand-primary mb-6 shadow-sm">
                  <Icon className="w-5 h-5" />
                </div>

                <div className="font-serif text-4xl md:text-5xl font-black text-brand-dark tracking-tight mb-2">
                  {stat.isFloat ? (
                    
                    <DecimalCounter value={stat.value} suffix={stat.suffix} />
                  ) : (
                    <Counter value={stat.value} suffix={stat.suffix} />
                  )}
                </div>

                <h3 className="font-sans text-sm font-bold text-brand-dark mb-1">
                  {stat.name}
                </h3>
                <p className="text-xs text-brand-muted leading-relaxed">
                  {stat.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}


function DecimalCounter({ value, suffix }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => latest.toFixed(1) + suffix);

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration: 2,
        ease: [0.16, 1, 0.3, 1],
      });
      return controls.stop;
    }
  }, [isInView, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}
