"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, Send, Gift, DollarSign, RefreshCw, MessageSquare, Sparkles } from "lucide-react";
import Button from "@/components/ui/button";

const COMP_OPTIONS = [
  { value: "gifting", label: "Gifting", icon: Gift, description: "Receive free products in exchange for content" },
  { value: "paid", label: "Paid", icon: DollarSign, description: "Monetary compensation for your work" },
  { value: "barter", label: "Barter", icon: RefreshCw, description: "Exchange services or cross-promotion" },
  { value: "discuss", label: "Let's Discuss", icon: MessageSquare, description: "Open to negotiation" },
];

export default function ProposeCollabModal({ isOpen, onClose, brand, onSubmit }) {
  const [compensation, setCompensation] = useState("gifting");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!isOpen || !brand) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSending(true);

    // TODO: persist to backend
    setTimeout(() => {
      const pitch = {
        id: `pitch-${Date.now()}`,
        brandId: brand.id,
        brandName: brand.name,
        brandLogo: brand.logo,
        compensation,
        snippet: message,
        date: new Date().toISOString().split("T")[0],
        status: "pending",
      };
      onSubmit?.(pitch);
      setIsSending(false);
      setMessage("");
      setCompensation("gifting");
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-5 relative border border-brand-border/30">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-muted hover:text-brand-dark transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Brand header */}
        <div className="flex items-center gap-4 pb-4 border-b border-brand-border/40">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-brand-border/40 shrink-0 bg-white">
            <Image src={brand.logo} alt={brand.name} fill className="object-cover" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-brand-dark">Pitch to {brand.name}</h2>
            <p className="text-xs text-brand-muted">{brand.category} · {brand.location}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Compensation type */}
          <div>
            <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block mb-2">Compensation Type</label>
            <div className="grid grid-cols-2 gap-2">
              {COMP_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = compensation === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCompensation(opt.value)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-brand-primary bg-brand-primary/5 shadow-sm"
                        : "border-brand-border/50 hover:border-brand-border"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-brand-primary" : "text-brand-muted"}`} />
                    <div>
                      <p className={`text-sm font-bold ${isSelected ? "text-brand-primary" : "text-brand-dark"}`}>{opt.label}</p>
                      <p className="text-[10px] text-brand-muted leading-tight">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pitch message */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block">Your Pitch</label>
              <button
                type="button"
                onClick={() => {
                  const draft = compensation === "gifting" 
                    ? `Hi ${brand.name} team! I'm a huge fan of your products. I'd love to create a dedicated short-form video featuring your items in exchange for gifted product. Let me know if you're open to this!` 
                    : `Hi ${brand.name} team! I love your aesthetic and my audience would be a great fit. My base rate for a dedicated Reel is $300 + product. I'd love to discuss a potential partnership!`;
                  setMessage(draft);
                }}
                className="text-xs font-semibold text-brand-primary flex items-center gap-1 hover:underline"
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Draft
              </button>
            </div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell the brand why you'd be a great fit for a collaboration..."
              required
              className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark resize-none"
            />
          </div>

          {/* Submit */}
          <Button type="submit" variant="primary" className="w-full justify-center" disabled={isSending || !message.trim()}>
            {isSending ? "Sending..." : <><Send className="w-4 h-4 mr-1.5" /> Send Pitch</>}
          </Button>
        </form>
      </div>
    </div>
  );
}
