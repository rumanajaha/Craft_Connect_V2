"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Inbox, Sparkles, ArrowRight, ExternalLink } from "lucide-react";
import CollabRequestRow from "@/components/brand/CollabRequestRow";
import CreatorMatchCard from "@/components/brand/CreatorMatchCard";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

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
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ activeProducts: 0, pendingRequests: 0, aiMatches: 0 });
  const [pitches, setPitches] = useState([]);
  const [creators, setCreators] = useState([]);
  
  const [isGeneratingMatches, setIsGeneratingMatches] = useState(false);
  const [matchesGenerated, setMatchesGenerated] = useState(false);
  const [matchInputs, setMatchInputs] = useState({ productType: "", audience: "", goal: "" });

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch("/api/brand/dashboard");
        if (response.ok) {
          const data = await response.json();
          setStats({
            activeProducts: data.activeProducts,
            pendingRequests: data.pendingRequests,
            aiMatches: data.aiMatches
          });
          setPitches(data.pitches);
          setCreators(data.creators);
        }
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const handlePitchAction = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/brand/pitches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setPitches(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      }
    } catch (err) {
    }
  };

  const handleGenerateMatches = async (e) => {
    e.preventDefault();
    setIsGeneratingMatches(true);
    try {
      const response = await fetch("/api/brand/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matchInputs)
      });
      if (response.ok) {
        const data = await response.json();
        setCreators(data.matches);
        setMatchesGenerated(true);
      }
    } catch (err) {
    } finally {
      setIsGeneratingMatches(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-brand-muted text-sm font-semibold">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark">
            Dashboard
          </h1>
          <p className="text-brand-muted text-sm mt-1.5">
            Overview of your active campaigns, requests, and creator matches.
          </p>
        </div>

        <Link
          href="/brand/profile"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border/60 bg-white text-sm font-semibold text-brand-dark hover:border-brand-primary/50 hover:text-brand-primary transition-all shadow-sm shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          Preview public profile
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatPill icon={Package} value={stats.activeProducts} label="Active Products" />
        <StatPill icon={Inbox} value={stats.pendingRequests} label="Pending Requests" accent />
        <StatPill icon={Sparkles} value={stats.aiMatches} label="New AI Matches" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <section id="collaboration-requests" className="space-y-4">
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

        <section id="ai-creator-match" className="space-y-4">
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
                    Found {creators.length} matches
                  </span>
                  <button onClick={() => setMatchesGenerated(false)} className="text-xs font-semibold text-brand-muted hover:text-brand-dark transition-colors">
                    Reset search
                  </button>
                </div>
                {creators.map(creator => (
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
