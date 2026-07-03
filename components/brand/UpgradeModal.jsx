"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, ArrowRight } from "lucide-react";
import Button from "@/components/ui/button";

export default function UpgradeModal({ isOpen, onClose }) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    router.push("/brand/ai-studio/upgrade");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-6 relative border border-brand-border/30">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-brand-muted hover:text-brand-dark transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content */}
        <div className="text-center space-y-3 pt-2">
          <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto text-brand-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          
          <h2 className="font-serif text-xl font-bold text-brand-dark leading-tight">
            You've used all 3 free AI generations
          </h2>
          
          <p className="text-sm text-brand-muted leading-relaxed">
            Upgrade to premium to unlock unlimited AI tools, campaign planners, search tags generators, and advanced creator matching.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Button 
            variant="primary" 
            className="w-full justify-center shadow-lg shadow-brand-primary/15" 
            onClick={handleUpgrade}
          >
            Upgrade Now <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
          
          <button 
            onClick={onClose}
            className="w-full text-center text-xs font-semibold text-brand-muted hover:text-brand-dark py-2.5 transition-colors"
          >
            Maybe later
          </button>
        </div>

      </div>
    </div>
  );
}
