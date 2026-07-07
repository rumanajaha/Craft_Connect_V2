"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, MessageCircle, Heart, User, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center py-16 px-6 md:px-12 overflow-hidden">
      
      <div className="absolute inset-0 mesh-gradient pointer-events-none -z-10" />

      
      <div className="mx-auto max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        
        <div className="lg:col-span-6 flex flex-col justify-center text-left z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass w-fit mb-6 text-brand-primary font-medium text-xs md:text-sm tracking-wide"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI-POWERED CREATOR & BRAND CO-LAB</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl font-black text-brand-dark leading-[1.05] tracking-tight mb-8"
          >
            Handcrafted.<br />
            <span className="text-brand-primary italic font-normal">Connected.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-base md:text-lg text-brand-muted max-w-xl leading-relaxed mb-10 font-sans"
          >
            Discover elite independent makers, run AI-powered creator campaigns, and establish high-end brand partnerships. The premier editorial ecosystem for modern physical crafts.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center"
          >
            <motion.a
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              href="#discover"
              className="bg-brand-primary text-white hover:bg-brand-secondary px-8 py-4 rounded-full text-center font-medium shadow-md transition-colors inline-flex items-center justify-center gap-2"
            >
              Explore Brands
              <ArrowRight className="w-4 h-4" />
            </motion.a>
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/login"
                className="glass hover:bg-white/80 text-brand-dark px-8 py-4 rounded-full text-center font-medium transition-colors block w-full"
              >
                Join CraftConnect
              </Link>
            </motion.div>
          </motion.div>
        </div>

        
        <div className="lg:col-span-6 relative h-[600px] w-full flex items-center justify-center">
          
          
          <div className="absolute w-72 h-72 rounded-full bg-brand-accent/20 blur-3xl -z-10" />

          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20, y: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -8, rotate: -1, transition: { duration: 0.3 } }}
            drag
            dragConstraints={{ left: -30, right: 30, top: -30, bottom: 30 }}
            className="absolute top-8 left-4 md:left-8 w-64 md:w-72 glass p-4 rounded-3xl shadow-xl z-20 cursor-grab active:cursor-grabbing select-none"
          >
            <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-3">
              <Image
                src="https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&auto=format&fit=crop&q=80"
                alt="Clay Pottery Vase"
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                priority
                className="object-cover"
              />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-[10px] font-bold text-brand-dark px-2.5 py-1 rounded-full uppercase tracking-wider">
                Ceramics
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-brand-dark text-base">Ochre Clay Studio</h4>
                <p className="text-xs text-brand-muted">Kyoto & Portland</p>
              </div>
              <div className="flex items-center gap-1 bg-brand-accent/30 text-brand-primary font-bold text-xs px-2.5 py-1 rounded-full">
                <CheckCircle className="w-3 h-3 text-brand-primary" />
                <span>Verified</span>
              </div>
            </div>
          </motion.div>

          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -30, y: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6, rotate: 1, transition: { duration: 0.3 } }}
            drag
            dragConstraints={{ left: -30, right: 30, top: -30, bottom: 30 }}
            className="absolute bottom-16 right-4 md:right-8 w-60 md:w-64 glass p-4 rounded-2xl shadow-lg z-30 cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-brand-border">
                <Image
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Creator Avatar"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div>
                <h5 className="font-bold text-brand-dark text-xs">Elena Rostova</h5>
                <p className="text-[10px] text-brand-muted">Craft Aestheticist</p>
              </div>
            </div>
            <div className="space-y-1.5 border-t border-brand-border/40 pt-3">
              <div className="flex justify-between text-[10px]">
                <span className="text-brand-muted">Match Score</span>
                <span className="font-bold text-brand-primary">98%</span>
              </div>
              <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "98%" }}
                  transition={{ duration: 1.5, delay: 0.8 }}
                  className="h-full bg-brand-primary"
                />
              </div>
              <div className="text-[10px] text-brand-muted mt-1 italic">
                Matches "Minimalist Organic" visual aesthetic.
              </div>
            </div>
          </motion.div>

          
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 left-2 md:left-12 bg-white/80 backdrop-blur-md px-4 py-3 rounded-2xl shadow-md border border-brand-border/50 flex items-center gap-3 z-40 select-none"
          >
            <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-brand-primary">AI Studio</p>
              <p className="text-xs text-brand-dark font-medium">Story Generated</p>
            </div>
          </motion.div>

          
          <motion.div
            animate={{
              y: [0, 8, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="absolute top-1/4 right-2 md:right-16 bg-brand-dark text-cream px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 z-40 select-none"
          >
            <div className="w-8 h-8 rounded-full bg-brand-light/20 flex items-center justify-center text-brand-light">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] text-brand-light font-bold">New Collaboration Proposal</p>
              <p className="text-xs text-white font-medium">"I would love to curate..."</p>
            </div>
          </motion.div>

          
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -5, rotate: -0.5 }}
            className="absolute bottom-8 left-12 md:left-24 w-44 glass p-2 rounded-2xl shadow-lg z-10 hidden sm:block"
          >
            <div className="relative h-28 w-full rounded-xl overflow-hidden mb-2">
              <Image
                src="https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400&auto=format&fit=crop&q=80"
                alt="Soy Wax Candle"
                fill
                sizes="150px"
                className="object-cover"
              />
            </div>
            <div className="px-1 py-1">
              <p className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">Aether Scents</p>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs font-semibold text-brand-dark">Cedar Wood Candle</span>
                <Heart className="w-3.5 h-3.5 text-brand-primary fill-brand-primary" />
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
