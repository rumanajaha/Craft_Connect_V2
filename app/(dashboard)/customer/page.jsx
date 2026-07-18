"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, FileText, MessageCircle, Sparkles, ArrowRight, TrendingUp, Loader2 } from "lucide-react";
import BrandCard from "@/components/customer/BrandCard";
import RequestStatusBadge from "@/components/customer/RequestStatusBadge";
import { createClient } from "@/lib/supabase/client";

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

export default function CustomerDashboard() {
  const [saved, setSaved] = useState([]);
  const [greeting, setGreeting] = useState("");
  const [subtext, setSubtext] = useState("");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    saved_brands_count: 0,
    active_requests_count: 0,
    total_messages_count: 0,
    brands_available_count: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    async function buildGreeting() {
      const isNew  = sessionStorage.getItem("cc_new_user") === "1";
      let   name   = sessionStorage.getItem("cc_display_name") ?? "";

      if (!name) {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          const meta = user?.user_metadata ?? {};
          
          const rawName = meta.full_name ?? meta.name ?? user?.email ?? "";
          name = rawName.split(/[\s@]/)[0]; 
        } catch (_) {}
      }

      const firstName = name ? `, ${name}` : "";

      if (isNew) {
        sessionStorage.removeItem("cc_new_user");
        sessionStorage.removeItem("cc_display_name");
        setGreeting(`Welcome${firstName}!`);
        setSubtext("Your account is all set. Start discovering handcrafted brands.");
      } else {
        setGreeting(`Welcome back${firstName}!`);
        setSubtext("Here's what's happening with your brands and requests.");
      }
    }
    buildGreeting();
  }, []);

  // Load Saved brand IDs on mount & fetch dashboard metrics
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [dashRes, savedRes, reqRes] = await Promise.all([
          fetch("/api/customer/dashboard"),
          fetch("/api/customer/saved-brands"),
          fetch("/api/customer/requests")
        ]);

        if (dashRes.ok) {
          const dashData = await dashRes.json();
          if (dashData.stats) setStats(dashData.stats);
          setRecommended(dashData.recommended || []);
        }

        if (savedRes.ok) {
          const savedData = await savedRes.json();
          setSaved((savedData.savedBrands || []).map(b => b.id));
        }

        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setRecentRequests(reqData.requests || []);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleSave = (id) => {
    const isCurrentlySaved = saved.includes(id);
    const method = isCurrentlySaved ? "DELETE" : "POST";
    const url = isCurrentlySaved 
      ? `/api/customer/saved-brands?brandId=${id}`
      : `/api/customer/saved-brands`;
    
    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: isCurrentlySaved ? undefined : JSON.stringify({ brandId: id })
    }).catch(err => {
      console.error("Failed to toggle save:", err);
    });

    // Update counters dynamically on bookmark changes
    setStats(prevStats => ({
      ...prevStats,
      saved_brands_count: isCurrentlySaved
        ? Math.max(0, prevStats.saved_brands_count - 1)
        : prevStats.saved_brands_count + 1
    }));

    setSaved(prev => isCurrentlySaved ? prev.filter(b => b !== id) : [...prev, id]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-brand-muted text-sm font-semibold flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-300">

      {/* Greeting Header */}
      <div className="min-h-[72px]">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark">
          {greeting || <span className="opacity-0">Welcome</span>}
        </h1>
        <p className="text-brand-muted text-sm mt-1.5">
          {subtext || <span className="opacity-0">Loading...</span>}
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill icon={Bookmark}      value={stats.saved_brands_count}       label="Saved Brands"      />
        <StatPill icon={FileText}      value={stats.active_requests_count}     label="Active Requests"   accent />
        <StatPill icon={MessageCircle} value={stats.total_messages_count}      label="Total Messages"    />
        <StatPill icon={TrendingUp}    value={stats.brands_available_count}   label="Brands Available"  />
      </div>

      {/* Recent Requests Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-brand-dark">Recent Requests</h2>
          <Link href="/customer/messages" className="text-xs text-brand-primary font-semibold hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-brand-border/50 shadow-sm overflow-hidden">
          {recentRequests.length === 0 ? (
            <div className="p-8 text-center text-brand-muted text-sm">No requests yet.</div>
          ) : (
            <ul className="divide-y divide-brand-border/40">
              {recentRequests.slice(0, 5).map(req => (
                <li key={req.id}>
                  <Link
                    href={`/customer/messages${req.threadId ? `?thread=${req.threadId}` : ""}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-brand-border/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-brand-dark truncate">{req.subject}</p>
                      <p className="text-xs text-brand-muted mt-0.5 truncate">
                        {req.brandName} · {req.type}
                      </p>
                    </div>
                    <RequestStatusBadge status={req.status} />
                    <ArrowRight className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Recommended For You Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-brand-primary" />
          <h2 className="font-serif text-xl font-bold text-brand-dark">Recommended For You</h2>
          <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1">
            AI Picks
          </span>
        </div>
        
        {recommended.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-brand-border/50 shadow-sm text-brand-muted text-sm">
            No recommendations available.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {recommended.map(brand => (
              <BrandCard
                key={brand.id}
                brand={brand}
                isSaved={saved.includes(brand.id)}
                onToggleSave={toggleSave}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
