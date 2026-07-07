"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Users,
  CalendarDays,
  ScanText,
  Lightbulb as LightbulbIcon,
  TrendingUp,
  Award,
  Lightbulb,
  ArrowRight,
  Globe,
  Wrench,
  Settings,
  Sparkles
} from "lucide-react";
import UsageQuotaBar from "@/components/brand/UsageQuotaBar";
import { MOCK_AI_USAGE } from "@/lib/mockData";
import { useAIUsage } from "@/lib/aiUsageStore";


const PUBLISH_TOOLS = [
  {
    slug: "brand-story",
    title: "Brand Story Generator",
    description: "Craft a compelling about / philosophy narrative for your public brand profile.",
    icon: BookOpen,
    badge: "Publishes to brand profile",
  },
  {
    slug: "seo-description",
    title: "SEO Description Writer",
    description: "Generate high-converting, keyword-rich product copy that saves to your product catalogue.",
    icon: FileText,
    badge: "Saves to product",
  },
];

const WORKSPACE_TOOLS = [
  {
    slug: "creator-match",
    title: "Creator Match AI",
    description: "Find the perfect micro-influencer profiles for your next product launch.",
    icon: Users,
  },
  {
    slug: "campaign-planner",
    title: "Campaign Planner",
    description: "Generate a week-by-week strategy for influencer collaborations.",
    icon: CalendarDays,
  },
  {
    slug: "request-analyzer",
    title: "Request Analyzer",
    description: "Paste a messy customer inquiry to extract intent, specs, and budget.",
    icon: ScanText,
  },
  {
    slug: "content-inspiration",
    title: "Content Inspiration",
    description: "Generate hook ideas and angles for short-form video content.",
    icon: LightbulbIcon,
  },
];


function ToolCard({ tool, isPublish }) {
  const Icon = tool.icon;

  return (
    <Link
      href={`/brand/ai-studio/${tool.slug}`}
      className="group flex flex-col gap-4 p-5 bg-white border border-brand-border/50 rounded-2xl hover:border-brand-primary/40 hover:shadow-md hover:shadow-brand-primary/5 transition-all duration-200"
    >
      
      <div className="flex items-start justify-between gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
          isPublish
            ? "bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white"
            : "bg-brand-border/20 text-brand-dark/60 group-hover:bg-brand-dark/10 group-hover:text-brand-dark"
        }`}>
          <Icon className="w-5 h-5" />
        </div>

        {tool.badge && (
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shrink-0">
            <Globe className="w-2.5 h-2.5" />
            {tool.badge}
          </span>
        )}
      </div>

      
      <div className="flex-1">
        <h3 className="font-serif text-base font-bold text-brand-dark group-hover:text-brand-primary transition-colors leading-snug">
          {tool.title}
        </h3>
        <p className="text-xs text-brand-muted mt-1.5 leading-relaxed">
          {tool.description}
        </p>
      </div>

      
      <div className="flex items-center gap-1 text-xs font-semibold text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity">
        Open tool <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </Link>
  );
}


function SectionHeading({ icon: Icon, label, description }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-7 h-7 rounded-lg bg-brand-border/20 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-brand-dark/50" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-muted">{label}</p>
        {description && <p className="text-[10px] text-brand-muted/70 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}


export default function AIStudioHubPage() {
  const { usageByTool, FREE_TRIAL_LIMIT, isPro } = useAIUsage();
  
  const tools = Object.keys(usageByTool || {});
  const totalTools = tools.length || 8;
  const cappedTools = tools.filter(tool => (usageByTool[tool] || 0) >= FREE_TRIAL_LIMIT).length;
  const isCapped = !isPro && cappedTools > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            Generate campaigns, discover creator matches, and get content inspiration.
          </p>
        </div>
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
                        {cappedTools} of {totalTools} tools are at their free generation limit
                      </p>
                      <div className="w-full bg-brand-border/30 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${isCapped ? 'bg-amber-500' : 'bg-brand-primary'}`} 
                          style={{ width: `${Math.min(100, (cappedTools / totalTools) * 100)}%` }} 
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
            <SectionHeading
              icon={Globe}
              label="Public profile"
              description="Outputs here will update your public-facing CraftConnect presence"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PUBLISH_TOOLS.map(tool => (
                <ToolCard key={tool.slug} tool={tool} isPublish={true} />
              ))}
            </div>
          </div>

          
          <div>
            <SectionHeading
              icon={Wrench}
              label="Your workspace"
              description="Internal tools — output is never published to your public profile"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {WORKSPACE_TOOLS.map(tool => (
                <ToolCard key={tool.slug} tool={tool} isPublish={false} />
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-dark">Fastest Growing Brands</h4>
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

            <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-brand-dark">Opportunity Alert</h4>
                  <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                    Searches for "Sustainable Home Decor" are up 40% this week. Consider updating your brand story to highlight eco-friendly materials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
