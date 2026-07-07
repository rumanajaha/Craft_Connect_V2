"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export default function UsageQuotaBar({ used, total }) {
  const percentage = Math.min(100, Math.round((used / total) * 100));
  const isNearLimit = percentage >= 80;

  return (
    <div className="bg-white border border-brand-border/50 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-primary" />
          <h3 className="font-bold text-brand-dark text-sm">AI Studio Quota</h3>
        </div>
        <span className="text-xs font-bold text-brand-muted">
          {used} / {total}
        </span>
      </div>
      
      
      <div className="h-2 w-full bg-brand-border/30 rounded-full overflow-hidden">
        
        <div 
          className={`h-full transition-all duration-500 rounded-full ${
            isNearLimit ? "bg-amber-500" : "bg-brand-primary"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {isNearLimit && (
        <p className="text-[10px] text-amber-600 mt-2 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          You're nearing your monthly generation limit.
        </p>
      )}
    </div>
  );
}
