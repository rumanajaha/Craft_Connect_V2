"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, FileText, MessageCircle, Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import BrandCard from "@/components/customer/BrandCard";
import RequestStatusBadge from "@/components/customer/RequestStatusBadge";
import { createClient } from "@/lib/supabase/client";
import { useSavedBrands } from "@/hooks/useSavedBrands";

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
  const { savedIds, savedCount, hydrateSaved, toggleSave } = useSavedBrands();
  const [totalBrands, setTotalBrands] = useState(0);
  const [activeRequests, setActiveRequests] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recommendedBrands, setRecommendedBrands] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [subtext, setSubtext] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const isNew = sessionStorage.getItem("cc_new_user") === "1";
      let resolvedName = "";

      try {
        const [dashRes, reqsRes] = await Promise.all([
          fetch("/api/customer/dashboard"),
          fetch("/api/customer/requests"),
        ]);
        if (dashRes.ok) {
          const dash = await dashRes.json();
          hydrateSaved(
            dash.savedBrandIds || [],
            dash.stats?.savedBrands ?? 0
          );
          setTotalBrands(dash.totalBrands || 0);
          setActiveRequests(dash.stats?.activeRequests ?? 0);
          setTotalMessages(dash.stats?.totalMessages ?? 0);
          setRecommendedBrands(dash.recommendedBrands || []);
          if (dash.displayName?.trim()) {
            resolvedName = dash.displayName.trim().split(/\s+/)[0];
            sessionStorage.setItem("cc_display_name", dash.displayName.trim());
          }
        }
        if (reqsRes.ok) {
          const reqs = await reqsRes.json();
          setRecentRequests((reqs.requests || []).slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to load customer dashboard:", err);
      } finally {
        setLoadingRecs(false);
      }

      if (!resolvedName) {
        const cached = sessionStorage.getItem("cc_display_name") ?? "";
        if (cached.trim()) {
          resolvedName = cached.trim().split(/[\s@]/)[0];
        } else {
          try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const meta = user?.user_metadata ?? {};
            const rawName = meta.full_name ?? meta.name ?? user?.email ?? "";
            resolvedName = rawName.split(/[\s@]/)[0];
          } catch (_) {}
        }
      }

      const firstName = resolvedName ? `, ${resolvedName}` : "";
      if (isNew) {
        sessionStorage.removeItem("cc_new_user");
        setGreeting(`Welcome${firstName}! `);
        setSubtext("Your account is all set. Start discovering handcrafted brands.");
      } else {
        setGreeting(`Welcome back${firstName}! `);
        setSubtext("Here's what's happening with your brands and requests.");
      }
    }
    loadDashboard();
  }, [hydrateSaved]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="min-h-[72px]">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark">
          {greeting || <span className="opacity-0">Welcome</span>}
        </h1>
        <p className="text-brand-muted text-sm mt-1.5">
          {subtext || <span className="opacity-0">Loading...</span>}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill icon={Bookmark} value={savedCount} label="Saved Brands" />
        <StatPill icon={FileText} value={activeRequests} label="Active Requests" accent />
        <StatPill icon={MessageCircle} value={totalMessages} label="Total Messages" />
        <StatPill icon={TrendingUp} value={totalBrands} label="Brands Available" />
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-brand-dark">Recent Requests</h2>
          <Link href="/customer/messages" className="text-xs text-brand-primary font-semibold hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-brand-border/50 shadow-sm overflow-hidden">
          {recentRequests.length === 0 ? (
            <div className="p-8 text-center text-brand-muted text-sm">
              No requests yet. Explore brands on Discover to send a custom request.
            </div>
          ) : (
            <ul className="divide-y divide-brand-border/40">
              {recentRequests.map(req => (
                <li key={req.id}>
                  <Link
                    href={req.threadId ? `/customer/messages?thread=${req.threadId}` : "/customer/messages"}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-brand-border/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-brand-dark truncate">
                        {req.title}
                      </p>
                      <p className="text-xs text-brand-muted mt-0.5 truncate">
                        {req.brandName} · {req.requestType}
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

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-brand-primary" />
          <h2 className="font-serif text-xl font-bold text-brand-dark">Recommended For You</h2>
          <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1">
            AI Picks
          </span>
        </div>
        {loadingRecs ? (
          <div className="p-8 text-center text-brand-muted text-sm">Loading recommendations…</div>
        ) : recommendedBrands.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-brand-border/50 text-center text-brand-muted text-sm">
            No brand recommendations available yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {recommendedBrands.map(brand => (
              <BrandCard
                key={brand.id}
                brand={brand}
                isSaved={savedIds.includes(brand.id)}
                onToggleSave={(id) => toggleSave(id)}
                compact
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
