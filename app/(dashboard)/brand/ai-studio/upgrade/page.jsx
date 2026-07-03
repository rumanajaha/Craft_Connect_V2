"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Sparkles, X, Zap } from "lucide-react";
import Button from "@/components/ui/button";
import { useAIUsage } from "@/lib/aiUsageStore";

export default function UpgradePage() {
  const router = useRouter();
  const { isPro, handleUpgrade } = useAIUsage();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const onConfirmUpgrade = () => {
    // TODO: wire to real payment provider (Stripe or similar)
    handleUpgrade();
    setShowConfirmModal(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Confirm Upgrade Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-6 relative border border-brand-border/30">
            <button 
              onClick={() => setShowConfirmModal(false)} 
              className="absolute top-4 right-4 text-brand-muted hover:text-brand-dark transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-3 pt-2">
              <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto text-brand-primary">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-xl font-bold text-brand-dark">
                Confirm Upgrade
              </h2>
              <p className="text-sm text-brand-muted">
                This will connect to billing when payments are integrated. For now, this will unlock Pro features locally.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <Button variant="primary" className="w-full justify-center" onClick={onConfirmUpgrade}>
                Confirm
              </Button>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="w-full text-center text-xs font-semibold text-brand-muted hover:text-brand-dark py-2.5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back link */}
      <Link
        href="/brand/ai-studio"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to AI Studio
      </Link>

      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark">
          Supercharge your brand with AI
        </h1>
        <p className="text-brand-muted text-base">
          Unlock unlimited AI tools, advanced creator matching, and bulk generation features to grow your business faster.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-8">
        
        {/* Free Plan */}
        <div className="bg-white border border-brand-border/50 rounded-3xl p-8 shadow-sm flex flex-col relative">
          <div className="mb-6">
            <h3 className="font-serif text-2xl font-bold text-brand-dark mb-2">Free</h3>
            <p className="text-sm text-brand-muted">For exploring CraftConnect's AI capabilities.</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-bold text-brand-dark">$0</span>
            <span className="text-brand-muted">/month</span>
          </div>
          
          <div className="flex-1 space-y-4">
            <p className="text-sm font-bold text-brand-dark">Includes:</p>
            <ul className="space-y-3">
              {["3 AI generations total", "Access to all 6 AI Studio tools", "Basic creator matching", "Community support"].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-brand-dark">
                  <Check className="w-5 h-5 text-brand-muted shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mt-8">
            <Button variant="outline" className="w-full justify-center" disabled>
              Current Plan
            </Button>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="bg-brand-dark border border-brand-dark rounded-3xl p-8 shadow-xl shadow-brand-dark/10 flex flex-col relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-4">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r from-brand-primary to-orange-500 text-white shadow-sm">
              <Zap className="w-3 h-3" /> Most Popular
            </span>
          </div>

          <div className="mb-6">
            <h3 className="font-serif text-2xl font-bold text-white mb-2">Pro</h3>
            <p className="text-sm text-brand-border/70">For growing brands scaling their creator campaigns.</p>
          </div>
          <div className="mb-8">
            {/* // TODO: confirm real pricing */}
            <span className="text-4xl font-bold text-white">$19</span>
            <span className="text-brand-border/70">/month</span>
          </div>
          
          <div className="flex-1 space-y-4">
            <p className="text-sm font-bold text-brand-border/90">Everything in Free, plus:</p>
            {/* // TODO: confirm actual premium feature set with product */}
            <ul className="space-y-3">
              {[
                "Unlimited AI generations", 
                "Priority creator matching algorithm", 
                "Higher-quality AI video hook generation", 
                "Saved generation history",
                "Bulk product description generation"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/90">
                  <Check className="w-5 h-5 text-brand-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mt-8">
            {isPro ? (
              <Button className="w-full justify-center bg-white text-brand-dark hover:bg-brand-border" disabled>
                You are on Pro
              </Button>
            ) : (
              <Button className="w-full justify-center bg-brand-primary text-white hover:bg-brand-primary/90 border-0 shadow-lg shadow-brand-primary/20" onClick={() => setShowConfirmModal(true)}>
                Upgrade to Pro
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
