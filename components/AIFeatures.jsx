"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileText, UserCheck, MessageSquare, ListPlus, Send, LineChart, TrendingUp, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function AIFeatures() {
  // Brand Story Typewriter effect state
  const storyText = "In the misty forests of the Pacific Northwest, Sienna Botanicals was born from a desire to capture raw wilderness in a bottle. We wild-harvest each herb, blending pure jojoba oil with organic cedarwood to craft apothecary items that soothe both body and spirit...";
  const [displayedStory, setDisplayedStory] = useState("");
  const [storyIndex, setStoryIndex] = useState(0);

  useEffect(() => {
    if (storyIndex < storyText.length) {
      const timeout = setTimeout(() => {
        setDisplayedStory((prev) => prev + storyText[storyIndex]);
        setStoryIndex((prev) => prev + 1);
      }, 35);
      return () => clearTimeout(timeout);
    } else {
      // Loop typewriter
      const timeout = setTimeout(() => {
        setDisplayedStory("");
        setStoryIndex(0);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [storyIndex]);

  // Product description tags popping state
  const tags = ["Woody Scents", "Organic Soy Wax", "Luxury Vessel", "Warm Feeling"];
  const [visibleTags, setVisibleTags] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleTags((prev) => {
        if (prev.length === tags.length) return [];
        return [...prev, tags[prev.length]];
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="ai-features" className="py-24 px-6 md:px-12 bg-cream relative overflow-hidden">
      {/* Mesh background light */}
      <div className="absolute inset-0 mesh-gradient-warm opacity-70 pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl">
        
        {/* Title Header */}
        <div className="text-left max-w-3xl mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INTELLIGENT ECOSYSTEM</span>
          </div>
          <h2 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-brand-dark mb-6">
            AI Tools for Artisanal Brands
          </h2>
          <p className="text-brand-muted text-base md:text-lg leading-relaxed">
            We build state-of-the-art AI tooling specialized for creative craftspeople, automating stories, keyword descriptions, match scoring, and collaborations.
          </p>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CARD 1: Brand Story Generator (7 cols) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="lg:col-span-7 glass bg-white p-8 rounded-3xl shadow-sm border border-brand-border/60 flex flex-col justify-between min-h-[380px] group transition-all"
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-brand-dark">Brand Story Generator</h3>
                  <p className="text-xs text-brand-muted">Turn your raw craft rituals into editorial essays</p>
                </div>
              </div>

              {/* Mock AI Screen */}
              <div className="bg-[#FAF7F0]/60 border border-brand-border/60 rounded-2xl p-5 min-h-[160px] font-mono text-xs text-brand-dark/95 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-brand-border/40 pb-3 mb-3 text-[10px] text-brand-muted">
                  <span>INPUT: "forest ingredients, cedarwood oil, wild heritage"</span>
                  <span className="flex items-center gap-1 text-brand-primary font-bold">
                    <Sparkles className="w-3 h-3 animate-spin" /> GENERATING...
                  </span>
                </div>
                <p className="leading-relaxed font-sans text-[13px] text-brand-dark/80">
                  {displayedStory}
                  <span className="inline-block w-1.5 h-4 bg-brand-primary ml-0.5 animate-pulse" />
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between items-center border-t border-brand-border/30 pt-4">
              <span className="text-xs text-brand-muted">Generates standard-length stories in 3 styles.</span>
              <span className="text-xs font-bold text-brand-primary flex items-center gap-1 group-hover:underline">
                Try Tool <Sparkles className="w-3 h-3" />
              </span>
            </div>
          </motion.div>

          {/* CARD 2: Creator Match AI (5 cols) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="lg:col-span-5 glass bg-white p-8 rounded-3xl shadow-sm border border-brand-border/60 flex flex-col justify-between min-h-[380px] group transition-all"
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-brand-dark">Creator Match AI</h3>
                  <p className="text-xs text-brand-muted">Connect by visuals and aesthetic values</p>
                </div>
              </div>

              {/* Dynamic Matching Visual */}
              <div className="bg-[#FAF7F0]/40 rounded-2xl p-6 border border-brand-border/40 flex flex-col justify-center items-center h-48 relative overflow-hidden">
                
                {/* Connecting glow line */}
                <div className="absolute w-[80%] h-[1px] bg-brand-border top-1/2 left-[10%] transform -translate-y-1/2" />
                <motion.div
                  animate={{ left: ["10%", "90%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute w-8 h-8 rounded-full bg-brand-primary/10 blur-md top-1/2 transform -translate-y-1/2"
                />

                <div className="flex items-center justify-between w-full z-10">
                  {/* Brand Profile */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full border-2 border-brand-primary bg-white overflow-hidden flex items-center justify-center relative shadow-sm">
                      <Image
                        src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=100&auto=format&fit=crop&q=80"
                        alt="Brand Icon"
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-brand-dark">Ochre Clay</span>
                  </div>

                  {/* Percentage Glow Bubble */}
                  <div className="bg-brand-dark text-cream font-bold text-xs px-3 py-1.5 rounded-full shadow-lg border border-brand-primary/30 z-20 flex flex-col items-center">
                    <span className="text-[9px] text-brand-accent uppercase tracking-widest font-normal">MATCH</span>
                    <span className="text-sm font-black text-brand-primary">98%</span>
                  </div>

                  {/* Creator Profile */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full border-2 border-brand-secondary bg-white overflow-hidden flex items-center justify-center relative shadow-sm">
                      <Image
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                        alt="Creator Icon"
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-brand-dark">E. Rostova</span>
                  </div>
                </div>

                <div className="mt-4 text-center z-10">
                  <span className="bg-brand-accent/30 text-brand-primary font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                    Earth & Organic Aesthetic matched
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center border-t border-brand-border/30 pt-4">
              <span className="text-xs text-brand-muted">Matches based on visual portfolio assets.</span>
              <span className="text-xs font-bold text-brand-primary flex items-center gap-1 group-hover:underline">
                View Matches <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </motion.div>

          {/* CARD 3: Product Description Generator (5 cols) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="lg:col-span-5 glass bg-white p-8 rounded-3xl shadow-sm border border-brand-border/60 flex flex-col justify-between min-h-[380px] group transition-all"
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-light/10 flex items-center justify-center text-brand-secondary">
                  <ListPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-brand-dark">Tag & Spec Generator</h3>
                  <p className="text-xs text-brand-muted">Instantly generate rich product listings</p>
                </div>
              </div>

              {/* Tag builder demo */}
              <div className="bg-[#FAF7F0]/40 rounded-2xl p-5 border border-brand-border/40 min-h-[160px] flex flex-col justify-between">
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map((tag, i) => (
                    <motion.span
                      key={tag}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={visibleTags.includes(tag) ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white border border-brand-border px-3 py-1.5 rounded-lg text-xs font-medium text-brand-dark shadow-sm flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                      {tag}
                    </motion.span>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {visibleTags.length === tags.length ? (
                    <motion.div
                      key="filled"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-white rounded-xl p-3 border border-brand-border/60 text-xs leading-relaxed text-brand-dark/80"
                    >
                      "A luxurious, hand-poured soy wax candle infused with cedarwood oils. Perfect for quiet, meditative spaces."
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      className="text-xs text-brand-muted italic py-2"
                    >
                      Selecting ingredients and vibe profiles to build description...
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center border-t border-brand-border/30 pt-4">
              <span className="text-xs text-brand-muted">Optimizes for luxury editorial catalogs.</span>
              <span className="text-xs font-bold text-brand-primary flex items-center gap-1 group-hover:underline">
                Generate specs <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </motion.div>

          {/* CARD 4: Conversation Analyzer (7 cols) */}
          <motion.div
            whileHover={{ y: -5 }}
            className="lg:col-span-7 glass bg-white p-8 rounded-3xl shadow-sm border border-brand-border/60 flex flex-col justify-between min-h-[380px] group transition-all"
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-dark/10 flex items-center justify-center text-brand-dark">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-brand-dark">Conversation Analyzer</h3>
                  <p className="text-xs text-brand-muted">Track communication sentiment and proposal status</p>
                </div>
              </div>

              {/* Chat Analyzer Interface */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Chat Column */}
                <div className="md:col-span-7 bg-[#FAF7F0]/40 border border-brand-border/40 rounded-2xl p-4 space-y-3 max-h-[170px] overflow-y-auto hide-scrollbar">
                  <div className="bg-brand-primary/10 text-brand-dark p-2.5 rounded-2xl rounded-tl-none text-[11px] leading-relaxed max-w-[85%]">
                    "I love your handblown glasses. Can we arrange a visual reel for our summer capsule launch?"
                  </div>
                  <div className="bg-white text-brand-dark p-2.5 rounded-2xl rounded-tr-none text-[11px] leading-relaxed ml-auto max-w-[85%] border border-brand-border">
                    "Absolutely! I'm happy to ship samples and outline our glass studio schedule."
                  </div>
                </div>

                {/* Analysis Column */}
                <div className="md:col-span-5 flex flex-col justify-between bg-white border border-brand-border/40 rounded-2xl p-4">
                  <div>
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block mb-1">
                      REALTIME SIGNALS
                    </span>
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                      <TrendingUp className="w-4.5 h-4.5 text-emerald-500" />
                      <span>Positive (94%)</span>
                    </div>
                    <div className="text-[10px] text-brand-muted mt-2">
                      Agreement terms: High confidence. Proposal draft recommended.
                    </div>
                  </div>

                  <div className="mt-4 bg-[#FAF7F0] border border-brand-border/40 p-2 rounded-xl flex items-center justify-between text-[10px]">
                    <span className="text-brand-dark font-medium">Ready to propose?</span>
                    <span className="text-brand-primary font-bold cursor-pointer">Draft proposal</span>
                  </div>
                </div>

              </div>
            </div>

            <div className="mt-6 flex justify-between items-center border-t border-brand-border/30 pt-4">
              <span className="text-xs text-brand-muted">Monitors partnership deal terms to minimize friction.</span>
              <span className="text-xs font-bold text-brand-primary flex items-center gap-1 group-hover:underline">
                Open Dashboard <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
