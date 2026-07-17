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
    
    'trending-feed': 0,
    'brand-match': 0,
    'content-ideas': 0,
  };

  const [usageByTool, setUsageByTool] = useState(INITIAL_USAGE);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const refreshUsage = async (roleOverride) => {
    try {
      const activeRole = roleOverride || userRole;
      let endpoint = "/api/brand/ai/usage";
      if (activeRole === "CREATOR") {
        endpoint = "/api/creator/ai/usage";
      } else if (!activeRole) {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          setUserRole(meData.user?.role);
          if (meData.user?.role === "CREATOR") {
            endpoint = "/api/creator/ai/usage";
          }
        }
      }
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setUsageByTool(prev => ({ ...prev, ...data.usage }));
      }
    } catch (err) {
      console.error("Failed to load AI usage from API:", err);
    }
  };

  useEffect(() => {
    refreshUsage();
    const savedPro = localStorage.getItem("cc_is_pro");
    if (savedPro === "true") {
      setIsPro(true);
    }
  }, []);

  const incrementUsage = (toolKey) => {
    refreshUsage(); // Sync from backend
  };

  const isToolOverLimit = (toolKey) => {
    if (isPro) return false;
    return (usageByTool[toolKey] || 0) >= FREE_TRIAL_LIMIT;
  };

  const getRemainingForTool = (toolKey) => {
    if (isPro) return FREE_TRIAL_LIMIT; 
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
        handleUpgrade,
        refreshUsage
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
