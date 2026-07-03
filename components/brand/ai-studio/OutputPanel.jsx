import React, { useState } from "react";
import Link from "next/link";
import { Globe, Save, CheckCircle2, Sparkles, Check, Copy } from "lucide-react";
import Button from "@/components/ui/button";

export default function OutputPanel({ result, isGenerating, toolConfig, onPublish, onSaveToProduct, publishSuccess, saveSuccess }) {
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
          Fill in the form and click <span className="font-bold text-brand-dark">"{toolConfig.buttonText}"</span> to see your result here.
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

      {toolConfig.category === "publish" && (
        <div className="px-5 py-4 border-t border-brand-border/40 bg-brand-border/5 flex flex-wrap gap-3 items-center">
          {toolConfig.slug !== "seo-description" && (
            <>
              {publishSuccess ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Published to brand profile!
                  </div>
                  <Link href="/brand/profile" className="text-xs font-bold text-brand-primary hover:text-brand-dark transition-colors flex items-center gap-1">
                    View profile <Globe className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <Button variant="primary" onClick={onPublish} className="shadow-sm shadow-brand-primary/20">
                  <Globe className="w-4 h-4 mr-1.5" /> Publish to profile
                </Button>
              )}
              <p className="text-[10px] text-brand-muted">
                Updates your public "About the Brand" section.
              </p>
            </>
          )}

          {toolConfig.slug === "seo-description" && (
            <>
              {saveSuccess ? (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved to product!
                </div>
              ) : (
                <Button variant="primary" onClick={onSaveToProduct} className="shadow-sm shadow-brand-primary/20">
                  <Save className="w-4 h-4 mr-1.5" /> Save to product
                </Button>
              )}
              <p className="text-[10px] text-brand-muted">
                Updates this product's description across your profile and discover pages.
              </p>
            </>
          )}
        </div>
      )}

      {toolConfig.category === "workspace" && (
        <div className="px-5 py-4 border-t border-brand-border/40 bg-brand-border/5">
          <p className="text-[10px] text-brand-muted">
            This output is internal only — it won't appear on your public brand profile.
          </p>
        </div>
      )}
    </div>
  );
}
