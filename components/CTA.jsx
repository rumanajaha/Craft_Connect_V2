"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CTA() {
  return (
    <section id="cta" className="py-20 px-6 md:px-12 bg-cream relative overflow-hidden">
      <div className="mx-auto max-w-7xl">
        
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[40px] bg-gradient-to-br from-brand-secondary via-brand-primary to-brand-dark p-8 md:p-20 text-center overflow-hidden shadow-xl"
        >
          
          <div className="absolute inset-0 mesh-gradient-warm opacity-30 mix-blend-overlay pointer-events-none" />
          <div className="absolute -left-32 -bottom-32 w-96 h-96 rounded-full bg-brand-accent/30 blur-3xl pointer-events-none" />
          <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-cream/20 blur-3xl pointer-events-none" />

          
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-brand-accent mb-6"
            >
              <Sparkles className="w-5 h-5 text-brand-accent" />
            </motion.div>

            <h2 className="font-serif text-4xl md:text-7xl font-bold tracking-tight text-white leading-tight mb-6">
              Empower Your <br />
              <span className="italic font-normal text-brand-accent">Artisanal Vision</span>
            </h2>

            <p className="text-white/80 text-base md:text-lg max-w-xl leading-relaxed mb-10 font-sans">
              Join thousands of elite handmade studios and creative visual storytellers. Elevate your presence, discover aesthetic partners, and reach high-intent customers today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full sm:w-auto">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href="/login"
                  className="bg-white text-brand-dark hover:bg-cream px-8 py-4 rounded-full font-bold text-sm shadow-md transition-colors block text-center"
                >
                  Join as Brand
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href="/login"
                  className="bg-brand-dark text-cream border border-white/25 hover:bg-black px-8 py-4 rounded-full font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 w-full text-center"
                >
                  Join as Creator
                  <ArrowRight className="w-4 h-4 text-brand-accent" />
                </Link>
              </motion.div>
            </div>

            <p className="text-[10px] text-white/50 tracking-widest uppercase mt-8 font-bold">
              FREE DISCOVERY • DIRECT PURCHASE DIRECT LINKS • NO SALES COMMISSIONS
            </p>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
