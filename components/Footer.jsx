"use client";

import { ArrowRight, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-cream pt-20 pb-10 border-t border-brand-border/60 relative overflow-hidden">
      
      
      <div className="absolute left-10 bottom-0 w-80 h-80 rounded-full bg-brand-accent/10 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-brand-border/50">
          
          
          <div className="md:col-span-4 flex flex-col gap-6">
            <span className="font-serif text-3xl font-extrabold text-brand-dark tracking-tight">
              CraftConnect<span className="text-brand-primary">.</span>
            </span>
            <p className="text-sm text-brand-muted leading-relaxed max-w-xs">
              An AI-powered discovery and collaboration engine for independent handmade brands, creators, and discerning shoppers. Support direct, commission-free craftsmanship.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-full bg-white border border-brand-border flex items-center justify-center text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-colors" aria-label="Instagram">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white border border-brand-border flex items-center justify-center text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-colors" aria-label="Website">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white border border-brand-border flex items-center justify-center text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-colors" aria-label="Mail">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </a>
            </div>
          </div>

          
          <div className="md:col-span-4 grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-brand-dark">EXPLORE</h4>
              <a href="#discover" className="text-sm text-brand-muted hover:text-brand-primary transition-colors">Discover Brands</a>
              <a href="#ai-features" className="text-sm text-brand-muted hover:text-brand-primary transition-colors">AI Studios</a>
              <a href="#collaboration" className="text-sm text-brand-muted hover:text-brand-primary transition-colors">Collaborations</a>
              <a href="#how-it-works" className="text-sm text-brand-muted hover:text-brand-primary transition-colors">How It Works</a>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-brand-dark">PHILOSOPHY</h4>
              <a href="#" className="text-sm text-brand-muted hover:text-brand-primary transition-colors">Artisan Manifest</a>
              <a href="#" className="text-sm text-brand-muted hover:text-brand-primary transition-colors">Creator Guidelines</a>
              <a href="#" className="text-sm text-brand-muted hover:text-brand-primary transition-colors">Commission-Free Model</a>
              <a href="#" className="text-sm text-brand-muted hover:text-brand-primary transition-colors">Community Code</a>
            </div>
          </div>

          
          <div className="md:col-span-4 flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-dark flex items-center gap-1.5">
              <span>NEWSLETTER</span>
              <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
            </h4>
            <p className="text-sm text-brand-muted leading-relaxed">
              Subscribe to receive weekly curated craft profiles and design collection drops.
            </p>
            <form className="relative flex items-center mt-2 w-full">
              <input
                type="email"
                placeholder="email@domain.com"
                className="w-full bg-white border border-brand-border/60 hover:border-brand-primary/40 focus:border-brand-primary/80 focus:outline-none rounded-full px-5 py-3.5 text-xs text-brand-dark pr-12 transition-all shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 w-10 h-10 rounded-full bg-brand-dark text-cream hover:bg-brand-primary flex items-center justify-center transition-colors"
                aria-label="Subscribe"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-muted">
          <span>&copy; {new Date().getFullYear()} CraftConnect Platform. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-brand-dark transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand-dark transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-brand-dark transition-colors">Cookie Settings</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
