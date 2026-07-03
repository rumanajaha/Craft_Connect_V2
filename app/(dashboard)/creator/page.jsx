"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Handshake, Clock, TrendingUp, Gift, DollarSign, RefreshCw, MessageSquare, Sparkles } from "lucide-react";
import { MOCK_BRAND_MATCHES } from "@/lib/mockData";
import { useCollab } from "@/lib/collabStore";
import BrandMatchCard from "@/components/creator/BrandMatchCard";
import ProposeCollabModal from "@/components/creator/ProposeCollabModal";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white border border-brand-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">{label}</p>
      </div>
      <p className="text-2xl font-bold text-brand-dark font-serif">{value}</p>
    </div>
  );
}

function getCompensationBadge(type) {
  const map = {
    gifting: { icon: Gift, color: "bg-purple-50 text-purple-700 border-purple-200" },
    paid: { icon: DollarSign, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    barter: { icon: RefreshCw, color: "bg-blue-50 text-blue-700 border-blue-200" },
    discuss: { icon: MessageSquare, color: "bg-amber-50 text-amber-700 border-amber-200" },
  };
  return map[type] || map.discuss;
}

function getStatusBadge(status) {
  switch (status) {
    case "accepted": return "bg-emerald-50 text-emerald-600";
    case "declined": return "bg-red-50 text-red-600";
    default: return "bg-amber-50 text-amber-600";
  }
}

export default function CreatorDashboardPage() {
  const { outgoingPitches, addPitch } = useCollab();
  const [pitchBrand, setPitchBrand] = useState(null);
  
  // AI Matcher State
  const [isGeneratingMatches, setIsGeneratingMatches] = useState(false);
  const [matchesGenerated, setMatchesGenerated] = useState(false);
  const [matchInputs, setMatchInputs] = useState({ categories: "", comp: "", value: "" });

  const handleGenerateMatches = (e) => {
    e.preventDefault();
    setIsGeneratingMatches(true);
    setTimeout(() => {
      setIsGeneratingMatches(false);
      setMatchesGenerated(true);
    }, 1500);
  };

  const activePitches = outgoingPitches.filter(p => p.status === "accepted").length;
  const pendingPitches = outgoingPitches.filter(p => p.status === "pending").length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ProposeCollabModal */}
      <ProposeCollabModal
        isOpen={!!pitchBrand}
        onClose={() => setPitchBrand(null)}
        brand={pitchBrand}
        onSubmit={(pitch) => addPitch(pitch)}
      />

      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark">
          Welcome back, Sarah
        </h1>
        <p className="text-brand-muted text-sm mt-1.5">
          Here&apos;s an overview of your collaborations and opportunities.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Handshake} label="Active Collabs" value={activePitches} accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Clock} label="Pending Pitches" value={pendingPitches} accent="bg-amber-50 text-amber-600" />
        <StatCard icon={TrendingUp} label="Monthly Growth" value="+12%" accent="bg-brand-primary/10 text-brand-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Outgoing Pitches */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Handshake className="w-4 h-4 text-brand-primary" />
            <h2 className="font-serif text-xl font-bold text-brand-dark">My Pitches</h2>
          </div>

          {outgoingPitches.length === 0 ? (
            <div className="bg-white border border-dashed border-brand-border rounded-2xl p-8 text-center text-brand-muted text-sm">
              No pitches yet. Find a brand match below and send your first pitch!
            </div>
          ) : (
            <div className="space-y-3">
              {outgoingPitches.map(pitch => {
                const compBadge = getCompensationBadge(pitch.compensation);
                const CompIcon = compBadge.icon;
                return (
                  <div key={pitch.id} className="flex flex-col sm:flex-row gap-4 p-4 items-start sm:items-center bg-white border border-brand-border/50 rounded-2xl hover:shadow-sm transition-shadow">
                    {/* Brand Info */}
                    <div className="flex items-center gap-3 w-full sm:w-1/4 shrink-0">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-brand-border/40 shrink-0 bg-white">
                        <Image src={pitch.brandLogo} alt={pitch.brandName} fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-brand-dark truncate">{pitch.brandName}</p>
                        <p className="text-[11px] text-brand-muted">{pitch.date}</p>
                      </div>
                    </div>

                    {/* Compensation Badge */}
                    <div className="w-full sm:w-auto shrink-0">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${compBadge.color}`}>
                        <CompIcon className="w-3.5 h-3.5" />
                        {pitch.compensation}
                      </div>
                    </div>

                    {/* Snippet */}
                    <div className="flex-1 w-full min-w-0">
                      <p className="text-sm text-brand-dark/80 line-clamp-2 leading-relaxed">&quot;{pitch.snippet}&quot;</p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center w-full sm:w-auto shrink-0 justify-end">
                      <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${getStatusBadge(pitch.status)}`}>
                        {pitch.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Brand Matches */}
        <aside className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-4 h-4 text-brand-primary" />
            <h2 className="font-serif text-xl font-bold text-brand-dark">AI Brand Matches</h2>
          </div>

          <div className="space-y-3">
            {!matchesGenerated ? (
              <div className="bg-white border border-brand-border/50 rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-brand-muted mb-4">
                  Describe your ideal brand partners to get AI recommendations.
                </p>
                <form onSubmit={handleGenerateMatches} className="space-y-4">
                  <Input label="Brand categories" value={matchInputs.categories} onChange={e => setMatchInputs(p => ({ ...p, categories: e.target.value }))} placeholder="e.g. Sustainable Fashion, Home Decor" required />
                  <Input label="Preferred comp type" value={matchInputs.comp} onChange={e => setMatchInputs(p => ({ ...p, comp: e.target.value }))} placeholder="e.g. Paid, High-value gifting" required />
                  <Input label="Your distinct value" value={matchInputs.value} onChange={e => setMatchInputs(p => ({ ...p, value: e.target.value }))} placeholder="e.g. High engagement, aesthetic videos" required />
                  <Button type="submit" variant="primary" className="w-full" disabled={isGeneratingMatches}>
                    {isGeneratingMatches ? "Scanning brands..." : "Find Matches"}
                  </Button>
                </form>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    Found {MOCK_BRAND_MATCHES.slice(0, 3).length} matches
                  </span>
                  <button onClick={() => setMatchesGenerated(false)} className="text-xs font-semibold text-brand-muted hover:text-brand-dark transition-colors">
                    Reset search
                  </button>
                </div>
                {MOCK_BRAND_MATCHES.slice(0, 3).map(brand => (
                  <BrandMatchCard key={brand.id} brand={brand} onPitch={(b) => setPitchBrand(b)} />
                ))}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
