"use client";

/**
 * BrandDataStore — single source of truth for the active brand's
 * mutable profile data (about text) and products (with descriptions).
 *
 * Both the Brand Owner AI Studio (write) and the Customer-facing
 * brand profile page (read) subscribe to this context so AI-published
 * content is immediately visible cross-role within the same session.
 *
 * TODO: persist to Supabase on every setBrandAbout / updateProductDescription call.
 *
 * NOTE: When the Creator dashboard brand-profile view is built, it should
 * also call useBrandData() here — no extra wiring needed, just import the hook.
 */

import React, { createContext, useContext, useState } from "react";
import { MOCK_BRANDS, MOCK_PRODUCTS } from "@/lib/mockData";

// ─────────────────────────────────────────────
// Active brand seed (the logged-in brand owner)
// ─────────────────────────────────────────────
const ACTIVE_BRAND_ID = "ochre-clay";
const seedBrand = MOCK_BRANDS.find(b => b.id === ACTIVE_BRAND_ID);
const seedProducts = MOCK_PRODUCTS.filter(p => p.brandId === ACTIVE_BRAND_ID);

// ─────────────────────────────────────────────
// Context definition
// ─────────────────────────────────────────────
const BrandDataContext = createContext(null);

const seedBrandInfo = {
  name: seedBrand?.name ?? "Ochre Clay Studio",
  category: seedBrand?.category ?? "Ceramics",
  location: seedBrand?.location ?? "Kyoto & Portland",
  website: seedBrand?.website ?? "https://ochreclay.example.com",
  videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  description: seedBrand?.about ?? "",
  tags: "minimalist, wabi-sabi, hand-thrown, stoneware",
  instagram: "ochreclay",
  tiktok: "ochre_clay_studio",
};

// Helper to log a dynamic feed update
export const addFeedUpdate = (updateType, details) => {
  if (typeof window === "undefined") return;
  try {
    const existing = localStorage.getItem("cc_brand_updates");
    const updates = existing ? JSON.parse(existing) : [];
    
    // Check if duplicate update in the last 5 seconds to prevent spam
    if (updates.length > 0 && updates[0].updateText === details && Date.now() - new Date(updates[0].created_at).getTime() < 5000) {
      return;
    }

    const newUpdate = {
      id: `update-${Date.now()}`,
      brandId: ACTIVE_BRAND_ID,
      brandName: "Ochre Clay Studio",
      brandLogo: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=120&auto=format&fit=crop&q=80",
      type: "brand_update",
      updateType, // "story" | "product_add" | "product_seo"
      updateText: details,
      created_at: new Date().toISOString(),
      views: Math.floor(Math.random() * 500) + 100,
      saves: Math.floor(Math.random() * 50) + 10,
      rating: 4.9,
      ai_tags: ["ceramics", "handmade", "minimalist", "wabi-sabi", "tableware"]
    };
    localStorage.setItem("cc_brand_updates", JSON.stringify([newUpdate, ...updates]));
  } catch (e) {
    console.error("Failed to save brand update to feed storage:", e);
  }
};

export function BrandDataProvider({ children }) {
  // Full Brand Info state initialized from localStorage if available
  const [brandInfo, setBrandInfoState] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cc_brand_info");
      if (saved) return JSON.parse(saved);
    }
    return seedBrandInfo;
  });

  const setBrandInfo = (newInfo) => {
    setBrandInfoState(newInfo);
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_brand_info", JSON.stringify(newInfo));
    }
  };

  const brandAbout = brandInfo.description;
  const setBrandAbout = (aboutText) => {
    const updatedInfo = { ...brandInfo, description: aboutText };
    setBrandInfo(updatedInfo);
    addFeedUpdate("story", `Ochre Clay Studio published a new brand story focusing on ${brandInfo.category.toLowerCase()} craftsmanship.`);
  };

  // Products array initialized from localStorage if available
  const [products, setProductsState] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cc_brand_products");
      if (saved) return JSON.parse(saved);
    }
    return seedProducts;
  });

  const setProducts = (newProducts) => {
    setProductsState(newProducts);
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_brand_products", JSON.stringify(newProducts));
    }
  };

  /**
   * Update a single product's description in the shared store.
   * Called by the SEO Description Writer after "Save to product".
   */
  const updateProductDescription = (productId, description) => {
    const nextProducts = products.map(p => p.id === productId ? { ...p, description } : p);
    setProducts(nextProducts);
    const prod = products.find(p => p.id === productId);
    const prodName = prod ? prod.name : "a product";
    addFeedUpdate("product_seo", `Ochre Clay Studio updated the SEO description for "${prodName}".`);
  };

  return (
    <BrandDataContext.Provider value={{
      brandInfo,
      setBrandInfo,
      brandAbout,
      setBrandAbout,       // AI Studio Brand Story → "Publish to profile"
      products,
      setProducts,
      updateProductDescription,
      activeBrandId: ACTIVE_BRAND_ID,
    }}>
      {children}
    </BrandDataContext.Provider>
  );
}

/**
 * Hook — call in any component that needs to read or write brand data.
 *
 * Returns fallback values from localStorage or seed if called outside the provider
 */
export function useBrandData() {
  const ctx = useContext(BrandDataContext);
  if (!ctx) {
    // Graceful fallback for components rendered outside the provider (e.g. Customer, Creator)
    let localBrandInfo = seedBrandInfo;
    let localProducts = seedProducts;
    
    if (typeof window !== "undefined") {
      const savedInfo = localStorage.getItem("cc_brand_info");
      if (savedInfo) localBrandInfo = JSON.parse(savedInfo);
      
      const savedProds = localStorage.getItem("cc_brand_products");
      if (savedProds) localProducts = JSON.parse(savedProds);
    }

    return {
      brandInfo: localBrandInfo,
      brandAbout: localBrandInfo.description,
      setBrandAbout: () => {},
      products: localProducts,
      setProducts: () => {},
      updateProductDescription: () => {},
      activeBrandId: ACTIVE_BRAND_ID,
    };
  }
  return ctx;
}
