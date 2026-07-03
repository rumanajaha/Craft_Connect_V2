"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Globe, Sparkles } from "lucide-react";
import { useBrandData } from "@/lib/brandDataStore";
import { useAIUsage } from "@/lib/aiUsageStore";

import { TOOL_CONFIG } from "@/components/brand/ai-studio/config";
import OutputPanel from "@/components/brand/ai-studio/OutputPanel";
import {
  BrandStoryForm,
  SEODescriptionForm,
  CreatorMatchForm,
  CampaignPlannerForm,
  RequestAnalyzerForm,
  ContentInspirationForm
} from "@/components/brand/ai-studio/Forms";

function ToolPageContent() {
  const { tool } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const config = TOOL_CONFIG[tool];

  const { setBrandAbout, products, updateProductDescription } = useBrandData();

  const preSelectedProduct = searchParams?.get("product") ?? "";
  const [selectedProductId, setSelectedProductId] = useState(preSelectedProduct);

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { isPro, getRemainingForTool, triggerGeneration, incrementUsage, FREE_TRIAL_LIMIT } = useAIUsage();

  useEffect(() => {
    setResult(null);
    setPublishSuccess(false);
    setSaveSuccess(false);
  }, [tool]);

  useEffect(() => {
    if (preSelectedProduct) setSelectedProductId(preSelectedProduct);
  }, [preSelectedProduct]);

  if (!config) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <p className="text-brand-muted font-medium">Tool not found.</p>
        <Link href="/brand/ai-studio" className="text-brand-primary text-sm mt-2 inline-block hover:underline">
          ← Back to AI Studio
        </Link>
      </div>
    );
  }

  const Icon = config.icon;

  const handleGenerate = (_inputs) => {
    const allowed = triggerGeneration(tool);
    if (!allowed) return;

    setIsGenerating(true);
    setResult(null);
    setPublishSuccess(false);
    setSaveSuccess(false);

    setTimeout(() => {
      setResult(config.mockResult);
      setIsGenerating(false);
      incrementUsage(tool);
    }, 800);
  };

  const handlePublish = () => {
    if (!result) return;
    setBrandAbout(result);
    setPublishSuccess(true);
  };

  const handleSaveToProduct = () => {
    if (!result || !selectedProductId) return;
    updateProductDescription(selectedProductId, result);
    setSaveSuccess(true);
  };

  const renderForm = () => {
    switch (tool) {
      case "brand-story":       return <BrandStoryForm onGenerate={handleGenerate} isGenerating={isGenerating} />;
      case "seo-description":   return <SEODescriptionForm onGenerate={handleGenerate} isGenerating={isGenerating} products={products} selectedProductId={selectedProductId} setSelectedProductId={setSelectedProductId} />;
      case "creator-match":     return <CreatorMatchForm onGenerate={handleGenerate} isGenerating={isGenerating} />;
      case "campaign-planner":  return <CampaignPlannerForm onGenerate={handleGenerate} isGenerating={isGenerating} />;
      case "request-analyzer":  return <RequestAnalyzerForm onGenerate={handleGenerate} isGenerating={isGenerating} />;
      case "content-inspiration": return <ContentInspirationForm onGenerate={handleGenerate} isGenerating={isGenerating} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href="/brand/ai-studio"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        AI Studio
      </Link>

      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          config.category === "publish"
            ? "bg-brand-primary/10 text-brand-primary"
            : "bg-brand-border/20 text-brand-dark/60"
        }`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-brand-dark">{config.title}</h1>
          <p className="text-brand-muted text-sm mt-1">{config.description}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {config.category === "publish" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <Globe className="w-2.5 h-2.5" /> Publishes to public profile
              </span>
            )}
            {!isPro && (
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                {getRemainingForTool(tool)} of {FREE_TRIAL_LIMIT} free generations left
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white border border-brand-border/50 rounded-2xl p-6 shadow-sm">
          <h2 className="font-serif font-bold text-brand-dark text-lg mb-5 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-primary" />
            Inputs
          </h2>
          {renderForm()}
        </div>

        <div>
          <OutputPanel
            result={result}
            isGenerating={isGenerating}
            toolConfig={{ ...config, slug: tool }}
            onPublish={handlePublish}
            onSaveToProduct={handleSaveToProduct}
            publishSuccess={publishSuccess}
            saveSuccess={saveSuccess}
          />

          {result && !isGenerating && (
            <button
              onClick={() => { setResult(null); setPublishSuccess(false); setSaveSuccess(false); }}
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-dark transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear & regenerate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ToolPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto py-16 flex items-center justify-center text-brand-muted text-sm">
        Loading tool…
      </div>
    }>
      <ToolPageContent />
    </Suspense>
  );
}
