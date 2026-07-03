"use client";

import React, { useState } from "react";
import { Bookmark } from "lucide-react";
import { MOCK_BRANDS } from "@/lib/mockData";
import BrandCard from "@/components/customer/BrandCard";

const INITIAL_SAVED = ["ochre-clay", "gaea-weaves", "aether-scents"];

export default function SavedBrandsPage() {
  const [saved, setSaved] = useState(INITIAL_SAVED);

  const toggleSave = (id) =>
    setSaved(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);

  const savedBrands = MOCK_BRANDS.filter(b => saved.includes(b.id));

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
              isSaved
              onToggleSave={toggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
