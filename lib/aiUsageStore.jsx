"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const FREE_TRIAL_LIMIT = 3;
const AIUsageContext = createContext(null);

export function AIUsageProvider({ children }) {
  const INITIAL_USAGE = {
    'banner-video': 0,
    'brand-story': 0,
    'recommendation-tags': 0,
    'seo-description': 0,
    'creator-match': 0,
    'campaign-planner': 0,
    'request-analyzer': 0,
    'content-inspiration': 0,
    // Creator tools
    'trending-feed': 0,
    'brand-match': 0,
    'content-ideas': 0,
  };

  const [usageByTool, setUsageByTool] = useState(INITIAL_USAGE);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isPro, setIsPro] = useState(false);

  // Load from localStorage if present (optional mock persistence during session)
  useEffect(() => {
    const saved = localStorage.getItem("cc_usage_by_tool");
    if (saved) {
      try {
        setUsageByTool({ ...INITIAL_USAGE, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to parse cc_usage_by_tool", e);
      }
    }
    const savedPro = localStorage.getItem("cc_is_pro");
    if (savedPro === "true") {
      setIsPro(true);
    }
  }, []);

  const incrementUsage = (toolKey) => {
    setUsageByTool((prev) => {
      const next = { ...prev, [toolKey]: (prev[toolKey] || 0) + 1 };
      localStorage.setItem("cc_usage_by_tool", JSON.stringify(next));
      return next;
    });
  };

  const isToolOverLimit = (toolKey) => {
    if (isPro) return false;
    return (usageByTool[toolKey] || 0) >= FREE_TRIAL_LIMIT;
  };

  const getRemainingForTool = (toolKey) => {
    if (isPro) return FREE_TRIAL_LIMIT; // Technically unlimited, but max for UI
    return Math.max(0, FREE_TRIAL_LIMIT - (usageByTool[toolKey] || 0));
  };

  const triggerGeneration = (toolKey) => {
    if (isToolOverLimit(toolKey)) {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };

  const handleUpgrade = () => {
    setIsPro(true);
    localStorage.setItem("cc_is_pro", "true");
  };

  return (
    <AIUsageContext.Provider
      value={{
        usageByTool,
        FREE_TRIAL_LIMIT,
        incrementUsage,
        isToolOverLimit,
        getRemainingForTool,
        triggerGeneration,
        showUpgradeModal,
        setShowUpgradeModal,
        isPro,
        handleUpgrade
      }}
    >
      {children}
    </AIUsageContext.Provider>
  );
}

export function useAIUsage() {
  const context = useContext(AIUsageContext);
  if (!context) {
    throw new Error("useAIUsage must be used within an AIUsageProvider");
  }
  return context;
}
