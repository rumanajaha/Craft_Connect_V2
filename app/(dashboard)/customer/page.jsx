"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, FileText, MessageCircle, Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { MOCK_BRANDS, MOCK_REQUESTS, MOCK_MESSAGES } from "@/lib/mockData";
import BrandCard from "@/components/customer/BrandCard";
import RequestStatusBadge from "@/components/customer/RequestStatusBadge";
import { createClient } from "@/lib/supabase/client";

// TODO: replace with real saved brands from user profile API
const INITIAL_SAVED = ["ochre-clay", "gaea-weaves"];

// TODO: replace with real AI personalization engine feed API call
const RECOMMENDED_BRANDS = MOCK_BRANDS.slice(0, 5);

// Small inline stat pill
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
  const [saved, setSaved] = useState(INITIAL_SAVED);

  // Greeting state
  const [greeting, setGreeting] = useState("");
  const [subtext, setSubtext] = useState("");

  useEffect(() => {
    async function buildGreeting() {
      // Check if this is a fresh signup (set by signup-form.jsx in sessionStorage)
      const isNew  = sessionStorage.getItem("cc_new_user") === "1";
      let   name   = sessionStorage.getItem("cc_display_name") ?? "";

      // If no name from session, try Supabase user metadata
      if (!name) {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          const meta = user?.user_metadata ?? {};
          // full_name (Google/OAuth), name (some providers), or email prefix
          const rawName = meta.full_name ?? meta.name ?? user?.email ?? "";
          name = rawName.split(/[\s@]/)[0]; // first word or email prefix
        } catch (_) {}
      }

      const firstName = name ? `, ${name}` : "";

      if (isNew) {
        // Clear the flag immediately so next visit shows "Welcome back"
        sessionStorage.removeItem("cc_new_user");
        sessionStorage.removeItem("cc_display_name");
        setGreeting(`Welcome${firstName}! `);
        setSubtext("Your account is all set. Start discovering handcrafted brands.");
      } else {
        setGreeting(`Welcome back${firstName}! `);
        setSubtext("Here's what's happening with your brands and requests.");
      }
    }
    buildGreeting();
  }, []);

  const toggleSave = (id) =>
    setSaved(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);

  const activeRequests = MOCK_REQUESTS.filter(r => r.status !== "closed").length;
  const totalMessages  = MOCK_MESSAGES.reduce((sum, t) => sum + t.messages.length, 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* Page header */}
      <div className="min-h-[72px]">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark">
          {greeting || <span className="opacity-0">Welcome</span>}
        </h1>
        <p className="text-brand-muted text-sm mt-1.5">
          {subtext || <span className="opacity-0">Loading...</span>}
        </p>
      </div>

      {/* Stat pills row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill icon={Bookmark}      value={saved.length}       label="Saved Brands"      />
        <StatPill icon={FileText}      value={activeRequests}     label="Active Requests"   accent />
        <StatPill icon={MessageCircle} value={totalMessages}      label="Total Messages"    />
        <StatPill icon={TrendingUp}    value={MOCK_BRANDS.length} label="Brands Available"  />
      </div>

      {/* Recent Requests */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-brand-dark">Recent Requests</h2>
          <Link href="/customer/messages" className="text-xs text-brand-primary font-semibold hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-brand-border/50 shadow-sm overflow-hidden">
          {MOCK_REQUESTS.length === 0 ? (
            <div className="p-8 text-center text-brand-muted text-sm">No requests yet.</div>
          ) : (
            <ul className="divide-y divide-brand-border/40">
              {MOCK_REQUESTS.map(req => {
                const brand  = MOCK_BRANDS.find(b => b.id === req.brandId);
                const thread = MOCK_MESSAGES.find(m => m.brandId === req.brandId);
                return (
                  <li key={req.id}>
                    <Link
                      href={`/customer/messages?thread=${thread?.id ?? ""}`}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-brand-border/10 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-brand-dark truncate">{req.subject}</p>
                        <p className="text-xs text-brand-muted mt-0.5 truncate">{brand?.name} · {req.type}</p>
                      </div>
                      <RequestStatusBadge status={req.status} />
                      <ArrowRight className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Recommended Brands */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-brand-primary" />
          <h2 className="font-serif text-xl font-bold text-brand-dark">Recommended For You</h2>
          <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1">
            AI Picks
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {RECOMMENDED_BRANDS.map(brand => (
            <BrandCard
              key={brand.id}
              brand={brand}
              isSaved={saved.includes(brand.id)}
              onToggleSave={toggleSave}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
