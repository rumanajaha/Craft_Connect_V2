"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Lightbulb,
  ArrowRight,
  Wrench,
  Sparkles,
  Award,
} from "lucide-react";
import { useAIUsage } from "@/lib/aiUsageStore";
import { MOCK_AI_USAGE } from "@/lib/mockData";

const CREATOR_TOOLS = [
  {
    slug: "trending-feed",
    title: "Trending & Inspiration",
    description: "Explore trending content categories and formats to stay ahead of the curve.",
    icon: TrendingUp,
  },
  {
    slug: "brand-match",
    title: "Brand Match Suggestions",
    description: "Get AI-ranked brand recommendations based on your niches and engagement.",
    icon: Users,
  },
  {
    slug: "content-ideas",
    title: "Content Idea Generation",
    description: "Generate tailored content hooks and video concepts for your channels.",
    icon: Lightbulb,
  },
];

function ToolCard({ tool }) {
  const Icon = tool.icon;
  return (
    <Link
      href={`/creator/ai-studio/${tool.slug}`}
      className="group flex flex-col gap-4 p-5 bg-white border border-brand-border/50 rounded-2xl hover:border-brand-primary/40 hover:shadow-md hover:shadow-brand-primary/5 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors bg-brand-border/20 text-brand-dark/60 group-hover:bg-brand-dark/10 group-hover:text-brand-dark">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex-1">
        <h3 className="font-serif text-base font-bold text-brand-dark group-hover:text-brand-primary transition-colors leading-snug">
          {tool.title}
        </h3>
        <p className="text-xs text-brand-muted mt-1.5 leading-relaxed">{tool.description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs font-semibold text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity">
        Open tool <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </Link>
  );
}

export default function CreatorAIStudioPage() {
  const { usageByTool, FREE_TRIAL_LIMIT, isPro } = useAIUsage();

  const creatorToolKeys = ["trending-feed", "brand-match", "content-ideas"];
  const cappedTools = creatorToolKeys.filter(k => (usageByTool[k] || 0) >= FREE_TRIAL_LIMIT).length;
  const isCapped = !isPro && cappedTools > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark flex flex-wrap items-center gap-3">
          <span>AI Studio</span>
          {isPro ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-brand-primary to-orange-500 text-white shadow-sm">
              <Sparkles className="w-3 h-3" /> PRO
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              Per-tool usage limits
            </span>
          )}
        </h1>
        <p className="text-brand-muted text-sm mt-1.5">
          Discover trends, find brand matches, and get content inspiration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <div className="lg:col-span-2 space-y-8">
          
          <div className={`bg-white border rounded-2xl p-5 shadow-sm ${isCapped ? 'border-amber-300 shadow-amber-500/10' : 'border-brand-border/50'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="font-serif font-bold text-brand-dark text-lg mb-1 flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${isCapped ? 'text-amber-500' : 'text-brand-primary'}`} />
                  Usage & Quota
                </h2>
                {isPro ? (
                  <p className="text-sm text-brand-muted">You are on the Pro plan with unlimited AI generations.</p>
                ) : (
                  <>
                    <p className="text-sm text-brand-muted mb-3">
                      {cappedTools} of {creatorToolKeys.length} tools at their free generation limit
                    </p>
                    <div className="w-full bg-brand-border/30 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${isCapped ? 'bg-amber-500' : 'bg-brand-primary'}`}
                        style={{ width: `${Math.min(100, (cappedTools / creatorToolKeys.length) * 100)}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
              {!isPro && (
                <div className="shrink-0">
                  <Link href="/brand/ai-studio/upgrade" className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isCapped ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20' : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20'}`}>
                    {isCapped ? "Upgrade Now" : "Upgrade to Pro"}
                  </Link>
                </div>
              )}
            </div>
          </div>

          
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-brand-border/20 flex items-center justify-center">
                <Wrench className="w-3.5 h-3.5 text-brand-dark/50" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-muted">Your tools</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CREATOR_TOOLS.map(tool => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </div>
        </div>

        
        <aside className="space-y-6">
          <div className="bg-white border border-brand-border/50 rounded-2xl p-5 shadow-sm space-y-6">
            <h3 className="font-serif font-bold text-brand-dark text-lg border-b border-brand-border/40 pb-3">
              AI Insights
            </h3>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-brand-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-dark">Trending Categories</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {MOCK_AI_USAGE.trendingCategories.map(cat => (
                  <span key={cat} className="inline-block px-2.5 py-1 rounded-full bg-brand-border/20 text-brand-dark/80 text-[10px] font-bold uppercase tracking-wider">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-brand-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-dark">Top Brands This Week</h4>
              </div>
              <ul className="space-y-2">
                {MOCK_AI_USAGE.fastestGrowing.map(brand => (
                  <li key={brand} className="text-sm text-brand-muted flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {brand}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
