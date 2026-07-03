"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button";
import { Sparkles, Check, Copy } from "lucide-react";

export default function AIToolCard({ title, description, inputs, mockResult, buttonText = "Generate" }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setResult(null);

    // Simulate network delay for AI generation
    // TODO: wire to Gemini API
    setTimeout(() => {
      setResult(mockResult);
      setIsGenerating(false);
    }, 1200);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-brand-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-brand-border/40 bg-gradient-to-br from-brand-primary/5 to-transparent">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-brand-primary" />
          <h3 className="font-serif font-bold text-brand-dark text-lg">{title}</h3>
        </div>
        <p className="text-xs text-brand-muted">{description}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} className="p-5 flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          {inputs}
        </div>
        
        <div className="mt-6 pt-4 border-t border-brand-border/40">
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full"
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : buttonText}
          </Button>
        </div>
      </form>

      {/* Result Panel */}
      {result && (
        <div className="bg-brand-dark text-white p-5 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary">Result</h4>
            <button 
              onClick={handleCopy}
              className="text-white/50 hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
            {result}
          </p>
        </div>
      )}
    </div>
  );
}
