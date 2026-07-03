"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Package, Inbox, Sparkles, ArrowRight, ExternalLink } from "lucide-react";
import { MOCK_PRODUCTS, MOCK_REQUESTS, MOCK_CREATOR_PITCHES, MOCK_CREATORS } from "@/lib/mockData";
import CollabRequestRow from "@/components/brand/CollabRequestRow";
import CreatorMatchCard from "@/components/brand/CreatorMatchCard";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

// Small inline stat pill (cloned/adapted from Customer dashboard)
function StatPill({ icon: Icon, value, label, accent }) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${
      accent
        ? "bg-brand-primary border-brand-primary shadow-md shadow-brand-primary/20 text-white"
        : "bg-white border-brand-border/50 shadow-sm text-brand-dark"
    }`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        accent ? "bg-white/20" : "bg-brand-primary/10"
      }`}>
        <Icon className={`w-4 h-4 ${accent ? "text-white" : "text-brand-primary"}`} />
      </div>
      <div>
        <p className={`text-2xl font-serif font-bold leading-none ${accent ? "text-white" : "text-brand-dark"}`}>
          {value}
        </p>
        <p className={`text-[11px] mt-0.5 font-medium ${accent ? "text-white/75" : "text-brand-muted"}`}>
          {label}
        </p>
      </div>
    </div>
  );
}

export default function BrandOverview() {
  const [pitches, setPitches] = useState(MOCK_CREATOR_PITCHES);
  
  // AI Matcher State
  const [isGeneratingMatches, setIsGeneratingMatches] = useState(false);
  const [matchesGenerated, setMatchesGenerated] = useState(false);
  const [matchInputs, setMatchInputs] = useState({ productType: "", audience: "", goal: "" });
  
  // Calculate mock stats (filtered to 'ochre-clay' as the dummy active brand)
  const activeBrandId = "ochre-clay";
  const activeProducts = MOCK_PRODUCTS.filter(p => p.brandId === activeBrandId && p.inStock).length;
  const pendingRequests = MOCK_REQUESTS.filter(r => r.brandId === activeBrandId && r.status === "pending").length;
  const aiMatches = MOCK_CREATORS.length;

  const handlePitchAction = (id, newStatus) => {
    // We update local state, actual backend mutation would go here
    setPitches(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    // In a real app we'd show a toast here
    // alert(`Pitch ${newStatus}`);
  };

  const handleGenerateMatches = (e) => {
    e.preventDefault();
    setIsGeneratingMatches(true);
    setTimeout(() => {
      setIsGeneratingMatches(false);
      setMatchesGenerated(true);
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark">
            Dashboard
          </h1>
          <p className="text-brand-muted text-sm mt-1.5">
            Overview of your active campaigns, requests, and creator matches.
          </p>
        </div>

        {/* Preview public profile */}
        <Link
          href="/brand/profile"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border/60 bg-white text-sm font-semibold text-brand-dark hover:border-brand-primary/50 hover:text-brand-primary transition-all shadow-sm shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          Preview public profile
        </Link>
      </div>

      {/* Stat pills row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatPill icon={Package} value={activeProducts} label="Active Products" />
        <StatPill icon={Inbox} value={pendingRequests} label="Pending Requests" accent />
        <StatPill icon={Sparkles} value={aiMatches} label="New AI Matches" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Col: Collab Requests */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-serif text-xl font-bold text-brand-dark">Incoming Pitches</h2>
            <Link href="/brand/messages" className="text-xs text-brand-primary font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {pitches.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-brand-border/50 text-brand-muted text-sm">
                No new pitches right now.
              </div>
            ) : (
              pitches.map(pitch => (
                <CollabRequestRow 
                  key={pitch.id} 
                  pitch={pitch} 
                  onAccept={(id) => handlePitchAction(id, "accepted")}
                  onReject={(id) => handlePitchAction(id, "rejected")}
                />
              ))
            )}
          </div>
        </section>

        {/* Right Col: AI Matches */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <h2 className="font-serif text-xl font-bold text-brand-dark">AI Creator Matches</h2>
            </div>
          </div>
          
          <div className="space-y-3">
            {!matchesGenerated ? (
              <div className="bg-white border border-brand-border/50 rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-brand-muted mb-4">
                  Describe your campaign to find the best micro-influencers.
                </p>
                <form onSubmit={handleGenerateMatches} className="space-y-4">
                  <Input label="Product type" value={matchInputs.productType} onChange={e => setMatchInputs(p => ({ ...p, productType: e.target.value }))} placeholder="e.g. Ceramic Mugs" required />
                  <Input label="Target audience" value={matchInputs.audience} onChange={e => setMatchInputs(p => ({ ...p, audience: e.target.value }))} placeholder="e.g. Women 25–35, coffee lovers" required />
                  <Input label="Campaign goal" value={matchInputs.goal} onChange={e => setMatchInputs(p => ({ ...p, goal: e.target.value }))} placeholder="e.g. Brand awareness" required />
                  <Button type="submit" variant="primary" className="w-full" disabled={isGeneratingMatches}>
                    {isGeneratingMatches ? "Scanning profiles..." : "Find Matches"}
                  </Button>
                </form>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    Found {MOCK_CREATORS.length} matches
                  </span>
                  <button onClick={() => setMatchesGenerated(false)} className="text-xs font-semibold text-brand-muted hover:text-brand-dark transition-colors">
                    Reset search
                  </button>
                </div>
                {MOCK_CREATORS.map(creator => (
                  <CreatorMatchCard key={creator.id} creator={creator} />
                ))}
              </>
            )}
          </div>
        </section>
      </div>

    </div>
  );
}
