"use client";

import React, { useState, useEffect } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import BrandCard from "@/components/customer/BrandCard";

export default function SavedBrandsPage() {
  const [savedBrands, setSavedBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadSavedBrands() {
    try {
      setLoading(true);
      const res = await fetch("/api/customer/saved-brands");
      if (res.ok) {
        const data = await res.json();
        setSavedBrands(data.savedBrands || []);
      }
    } catch (err) {
      console.error("Failed to load saved brands:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSavedBrands();
  }, []);

  const toggleSave = async (brandId) => {
    // Optimistically remove from view
    setSavedBrands(prev => prev.filter(b => b.id !== brandId));

    try {
      const res = await fetch(`/api/customer/saved-brands?brandId=${brandId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        // Rollback
        loadSavedBrands();
      }
    } catch (err) {
      console.error("Failed to unsave brand:", err);
      loadSavedBrands();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-brand-muted text-sm font-semibold flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
          Loading saved brands...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-dark">Saved Brands</h1>
        <p className="text-brand-muted text-sm mt-1.5">
          {savedBrands.length} brand{savedBrands.length !== 1 ? "s" : ""} bookmarked
        </p>
      </div>

      {savedBrands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <Bookmark className="w-10 h-10 text-brand-border" />
          <p className="font-serif text-lg font-bold text-brand-dark">No saved brands yet</p>
          <p className="text-sm text-brand-muted">Bookmark brands from the Discover page to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {savedBrands.map(brand => (
            <BrandCard
              key={brand.id}
              brand={brand}
              isSaved={true}
              onToggleSave={toggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
