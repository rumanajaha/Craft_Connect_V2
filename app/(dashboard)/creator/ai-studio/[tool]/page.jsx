"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Lightbulb,
  Copy,
  Check,
  Sparkles,
  RefreshCw
} from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { useAIUsage } from "@/lib/aiUsageStore";
import { MOCK_ACTIVE_CREATOR } from "@/lib/mockData";

// ─── Tool config ─────────────────────────────────────────────────────────────
const TOOL_CONFIG = {
  "trending-feed": {
    title: "Trending & Inspiration",
    description: "Explore trending content categories and formats to stay ahead of the curve.",
    icon: TrendingUp,
    buttonText: "Refresh Feed",
    noInput: true,
    mockResult: `TRENDING CONTENT CATEGORIES (Updated Today)

1. The "Anti-Trendy" Aesthetic
Focuses on raw, imperfect, and timeless craftsmanship. 
Best platforms: TikTok, Pinterest
Example hook: "Stop buying [item] from big box stores. Here's why handmade matters."

2. Behind-The-Scenes ASMR
No voiceover, just the natural sounds of the process (e.g. clay hitting the wheel, scissors cutting fabric). 
Best platforms: Instagram Reels, TikTok
Example: A 15-second loop of packing an order in silence.

3. "Day in the Life of a Maker"
Authentic, minimally edited vlogs showing the struggles and wins of small business owners.
Best platforms: YouTube Shorts, TikTok

RECOMMENDED ACTION: 
Try adapting the ASMR format to your ceramics niche this week. Engagement is up 42% for this style.`,
  },
  "brand-match": {
    title: "Brand Match Suggestions",
    description: "Get AI-ranked brand recommendations based on your niches and engagement.",
    icon: Users,
    buttonText: "Find Matches",
    noInput: false,
    mockResult: `AI BRAND MATCH RESULTS

Based on your profile (Ceramics, Slow Living, 45K followers, 4.8% ER), we found highly compatible brands looking for creators like you:

1. Ochre Clay Studio (94% Match)
Why it fits: Their rustic, wood-fired ceramics align perfectly with your slow-living aesthetic. 
Suggested Pitch: Gifting or $300 Paid for a "Morning Routine" reel featuring their speckled mugs.

2. Soren Objects (88% Match)
Why it fits: Their minimalist walnut woodwork appeals to your exact demographic.
Suggested Pitch: Barter (product exchange) for a styling/flat-lay photo series.

3. Sienna Botanicals (85% Match)
Why it fits: Organic skincare that complements the natural, grounded tone of your content.
Suggested Pitch: $500 Paid for an integrated YouTube sponsorship segment.`,
  },
  "content-ideas": {
    title: "Content Idea Generation",
    description: "Generate tailored content hooks and video concepts for your channels.",
    icon: Lightbulb,
    buttonText: "Generate Ideas",
    noInput: false,
    mockResult: `TOP 5 CONTENT HOOKS (Tailored for Slow Living & Ceramics)

1. The Morning Ritual
Hook: "Why I stopped using my phone for the first hour of the day."
Visuals: Brewing pour-over coffee, pouring into a handmade ceramic mug, sunlight streaming in. Soft lofi background track.

2. The Curator's Corner
Hook: "Three handmade items in my home I would save in a fire."
Visuals: Showcase 3 distinct artisanal pieces (perfect for integrating brand collabs).

3. The "Un-Haul" 
Hook: "Things I stopped buying to make my home feel more peaceful."
Visuals: Walking through a minimalist, curated living space. Educational tone.

4. The Sensory Experience
Hook: [Text only, no speech] "The sounds of a slow Sunday."
Visuals: ASMR focus — grinding coffee beans, opening a fresh book, the clink of a ceramic bowl.

5. The Maker's Story
Hook: "You won't believe how long it takes to make this one mug."
Visuals: Tell the story of a specific artisan brand you're collaborating with. Authenticity play.`,
  },
};

// ─── Output Panel ─────────────────────────────────────────────────────────────
function OutputPanel({ result, isGenerating, toolConfig }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white border border-brand-border/50 rounded-2xl gap-3">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-brand-muted animate-pulse">Generating with AI…</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white border border-dashed border-brand-border rounded-2xl gap-3 text-center p-8">
        <Sparkles className="w-8 h-8 text-brand-border" />
        <p className="text-sm font-medium text-brand-muted">
          {toolConfig.noInput ? "Click " : "Fill in the form and click "} 
          <span className="font-bold text-brand-dark">"{toolConfig.buttonText}"</span> to see your result here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-brand-border/50 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-brand-border/40 bg-brand-primary/5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-primary">AI Output</h3>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-dark transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="p-5">
        <p className="text-sm text-brand-dark leading-relaxed whitespace-pre-wrap">
          {result}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function CreatorToolPage() {
  const { tool: toolSlug } = useParams();
  const { usageByTool, FREE_TRIAL_LIMIT, isPro, incrementUsage } = useAIUsage();

  const [result, setResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    niche: MOCK_ACTIVE_CREATOR.niches.join(", "),
    topic: "",
  });

  const toolConfig = TOOL_CONFIG[toolSlug];
  if (!toolConfig) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand-muted">
        <p className="text-lg font-serif font-bold text-brand-dark">Tool not found</p>
        <Link href="/creator/ai-studio" className="text-brand-primary text-sm mt-2 hover:underline">← Back to AI Studio</Link>
      </div>
    );
  }

  const Icon = toolConfig.icon;
  const currentUsage = usageByTool[toolSlug] || 0;
  const isCapped = !isPro && currentUsage >= FREE_TRIAL_LIMIT;

  const handleGenerate = () => {
    if (isCapped) {
      alert("You have reached your limit for this tool. Please upgrade to Pro.");
      return;
    }
    
    setIsGenerating(true);
    setTimeout(() => {
      setResult(toolConfig.mockResult);
      setIsGenerating(false);
      incrementUsage(toolSlug);
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/creator/ai-studio" className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-primary transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Studio Hub
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-bold text-brand-dark">{toolConfig.title}</h1>
              {!isPro && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${isCapped ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'}`}>
                  {FREE_TRIAL_LIMIT - currentUsage} Free Left
                </span>
              )}
            </div>
            <p className="text-brand-muted text-sm mt-1 max-w-2xl">{toolConfig.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Form / Input */}
        <div className="bg-white border border-brand-border/50 rounded-2xl p-5 sm:p-6 shadow-sm">
          {!toolConfig.noInput ? (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block mb-1.5">Your Niches</label>
                <input
                  type="text"
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark"
                  placeholder="e.g. Slow Living, Ceramics, Home Decor"
                />
              </div>

              {toolSlug === "content-ideas" && (
                <div>
                  <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block mb-1.5">Specific Topic (Optional)</label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark"
                    placeholder="e.g. Morning coffee routine, setting the table"
                  />
                </div>
              )}

              <Button
                variant="primary"
                className={`w-full justify-center mt-2 ${isCapped ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleGenerate}
                disabled={isGenerating || isCapped}
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                {isGenerating ? "Generating..." : toolConfig.buttonText}
              </Button>
              
              {isCapped && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center text-center">
                  <p className="text-sm text-amber-800 font-medium mb-3">You've reached your free limit for this tool.</p>
                  <Link href="/brand/ai-studio/upgrade" className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-lg transition-colors shadow-sm shadow-amber-500/20">
                    Upgrade to Pro
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full min-h-[200px] gap-4">
              <p className="text-sm text-brand-muted">This tool requires no input. Click below to fetch the latest insights.</p>
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={isGenerating || isCapped}
                className={isCapped ? 'opacity-50' : ''}
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                {isGenerating ? "Fetching..." : toolConfig.buttonText}
              </Button>
              {isCapped && (
                <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-800 font-medium mb-2">Free limit reached.</p>
                  <Link href="/brand/ai-studio/upgrade" className="text-xs font-bold text-amber-700 underline hover:text-amber-800">
                    Upgrade to Pro
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Output */}
        <div className="lg:sticky lg:top-24">
          <OutputPanel
            result={result}
            isGenerating={isGenerating}
            toolConfig={toolConfig}
          />
        </div>
      </div>
    </div>
  );
}
