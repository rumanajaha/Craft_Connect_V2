"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bookmark } from "lucide-react";
import BrandCard from "@/components/customer/BrandCard";
import { useSavedBrands } from "@/hooks/useSavedBrands";

export default function SavedBrandsPage() {
  const [savedBrands, setSavedBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const { savedCount, hydrateSaved, toggleSave } = useSavedBrands();

  useEffect(() => {
    async function loadSaved() {
      try {
        const res = await fetch("/api/customer/saved-brands");
        if (res.ok) {
          const data = await res.json();
          setSavedBrands(data.brands || []);
          hydrateSaved(data.savedBrandIds || [], data.stats?.savedBrands ?? 0);
        }
      } catch (err) {
        console.error("Failed to load saved brands:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSaved();
  }, [hydrateSaved]);

  const handleToggle = useCallback(
    (brandId) => {
      const snapshot = savedBrands;
      toggleSave(brandId, {
        onOptimisticRemove: (id) =>
          setSavedBrands((prev) => prev.filter((b) => b.id !== id)),
        onRollback: () => setSavedBrands(snapshot),
      });
    },
    [savedBrands, toggleSave]
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-dark">Saved Brands</h1>
        <p className="text-brand-muted text-sm mt-1.5">
          {savedCount} brand{savedCount !== 1 ? "s" : ""} bookmarked
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-brand-muted">Loading saved brands…</div>
      ) : savedBrands.length === 0 ? (
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
              isSaved
              onToggleSave={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
