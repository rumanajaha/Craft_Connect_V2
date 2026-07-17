"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Handshake, Clock, TrendingUp, Gift, DollarSign, RefreshCw, MessageSquare, Sparkles, Loader2 } from "lucide-react";
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
  const { addPitch } = useCollab();
  const router = useRouter();
  const [pitchBrand, setPitchBrand] = useState(null);
  
  // Real data states
  const [creatorName, setCreatorName] = useState("Sarah");
  const [stats, setStats] = useState({
    active_collabs: 0,
    pending_pitches: 0,
    monthly_growth: "+0%"
  });
  const [pitches, setPitches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // AI Brand Matches states
  const [isGeneratingMatches, setIsGeneratingMatches] = useState(false);
  const [matchesGenerated, setMatchesGenerated] = useState(false);
  const [matchInputs, setMatchInputs] = useState({ categories: "", comp: "", value: "" });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true);
        
        // 1. Fetch Creator Profile to get real name
        const profileRes = await fetch("/api/creator/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.profile?.displayName) {
            setCreatorName(profileData.profile.displayName);
          }
        }

        // 2. Fetch Dashboard Statistics
        const statsRes = await fetch("/api/creator/dashboard");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // 3. Fetch Real Creator Pitches
        const pitchesRes = await fetch("/api/creator/pitches");
        if (pitchesRes.ok) {
          const pitchesData = await pitchesRes.json();
          setPitches(pitchesData.pitches || []);
        }
      } catch (err) {
        console.error("Error loading creator dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleGenerateMatches = async (e) => {
    e.preventDefault();
    setIsGeneratingMatches(true);
    try {
      const res = await fetch("/api/creator/ai/brand-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matchInputs)
      });
      if (res.ok) {
        setMatchesGenerated(true);
      } else {
        alert("Failed to call AI matching.");
      }
    } catch (err) {
      console.error(err);
      alert("Error finding brand matches.");
    } finally {
      setIsGeneratingMatches(false);
    }
  };

  const handleAddPitch = async (pitch) => {
    const res = await addPitch(pitch);
    if (res && res.threadId) {
      router.push(`/creator/messages?thread=${res.threadId}`);
    } else {
      // Refresh pitches & stats after a slight delay for Supabase synchronization
      setTimeout(async () => {
        try {
          const pitchesRes = await fetch("/api/creator/pitches");
          if (pitchesRes.ok) {
            const pitchesData = await pitchesRes.json();
            setPitches(pitchesData.pitches || []);
          }

          const statsRes = await fetch("/api/creator/dashboard");
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats(statsData);
          }
        } catch (err) {
          console.error("Error refreshing dashboard data:", err);
        }
      }, 500); // 500ms delay
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-brand-border/50 max-w-6xl mx-auto">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary mr-2" />
        <span className="text-sm font-semibold text-brand-muted">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <ProposeCollabModal
        isOpen={!!pitchBrand}
        onClose={() => setPitchBrand(null)}
        brand={pitchBrand}
        onSubmit={handleAddPitch}
      />

      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark">
          Welcome back, {creatorName}
        </h1>
        <p className="text-brand-muted text-sm mt-1.5">
          Here&apos;s an overview of your collaborations and opportunities.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Handshake} label="Active Collabs" value={stats.active_collabs} accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Clock} label="Pending Pitches" value={stats.pending_pitches} accent="bg-amber-50 text-amber-600" />
        <StatCard icon={TrendingUp} label="Monthly Growth" value={stats.monthly_growth} accent="bg-brand-primary/10 text-brand-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Handshake className="w-4 h-4 text-brand-primary" />
            <h2 className="font-serif text-xl font-bold text-brand-dark">My Pitches</h2>
          </div>

          {pitches.length === 0 ? (
            <div className="bg-white border border-dashed border-brand-border rounded-2xl p-8 text-center text-brand-muted text-sm">
              No pitches yet. Find a brand match below and send your first pitch!
            </div>
          ) : (
            <div className="space-y-3">
              {pitches.map(pitch => {
                const compBadge = getCompensationBadge(pitch.compensation);
                const CompIcon = compBadge.icon;
                return (
                  <div key={pitch.id} className="flex flex-col sm:flex-row gap-4 p-4 items-start sm:items-center bg-white border border-brand-border/50 rounded-2xl hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3 w-full sm:w-1/4 shrink-0">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-brand-border/40 shrink-0 bg-white">
                        <Image src={pitch.brandLogo} alt={pitch.brandName} fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-brand-dark truncate">{pitch.brandName}</p>
                        <p className="text-[11px] text-brand-muted">{pitch.date}</p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto shrink-0">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${compBadge.color}`}>
                        <CompIcon className="w-3.5 h-3.5" />
                        {pitch.compensation}
                      </div>
                    </div>

                    <div className="flex-1 w-full min-w-0">
                      <p className="text-sm text-brand-dark/80 line-clamp-2 leading-relaxed">&quot;{pitch.snippet}&quot;</p>
                    </div>

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
