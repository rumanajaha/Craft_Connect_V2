"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Search, SlidersHorizontal, LayoutGrid } from "lucide-react";
import { MOCK_BRANDS, MOCK_PRODUCTS } from "@/lib/mockData";
import BrandCard from "@/components/customer/BrandCard";
import ProductCard from "@/components/customer/ProductCard";
import Input from "@/components/ui/input";

const CATEGORIES = ["All", "Ceramics", "Textiles", "Woodwork", "Apothecary", "Lighting"];
const LOCATIONS  = ["All Locations", "Kyoto & Portland", "Seattle, WA", "Austin, TX", "Denver, CO", "San Francisco, CA", "Portland, OR"];
const MIN_RATINGS = [0, 3, 4, 4.5, 4.8];

const INITIAL_SAVED = ["ochre-clay"];

export default function DiscoverPage() {
  const [tab, setTab]           = useState("brands");      // "brands" | "products"
  const [query, setQuery]       = useState("");
  const [category, setCategory] = useState("All");
  const [location, setLocation] = useState("All Locations");
  const [minRating, setMinRating] = useState(0);
  const [saved, setSaved]       = useState(INITIAL_SAVED);

  const toggleSave = useCallback((id) =>
    setSaved(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]), []);

  const filteredBrands = useMemo(() => {
    const q = query.toLowerCase();
    return MOCK_BRANDS.filter(b =>
      (category === "All" || b.category === category) &&
      (location === "All Locations" || b.location === location) &&
      (b.rating >= minRating) &&
      (!q || b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q))
    );
  }, [query, category, location, minRating]);

  const filteredProducts = useMemo(() => {
    const q = query.toLowerCase();
    const catBrandIds = category === "All"
      ? MOCK_BRANDS.map(b => b.id)
      : MOCK_BRANDS.filter(b => b.category === category).map(b => b.id);
    return MOCK_PRODUCTS.filter(p =>
      catBrandIds.includes(p.brandId) &&
      (!q || p.name.toLowerCase().includes(q))
    );
  }, [query, category]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-dark">Discover</h1>
        <p className="text-brand-muted text-sm mt-1">Find handcrafted brands and products made by independent makers.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search brands or products…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-brand-border/80 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 text-sm text-brand-dark placeholder-brand-muted/60 outline-none transition-all"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <SlidersHorizontal className="w-4 h-4 text-brand-muted shrink-0" />

        {/* Category chips */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                category === c
                  ? "bg-brand-primary text-white border-brand-primary"
                  : "bg-white text-brand-muted border-brand-border/60 hover:border-brand-primary/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Location dropdown */}
        <select
          value={location}
          onChange={e => setLocation(e.target.value)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-brand-border/60 bg-white text-brand-muted hover:border-brand-primary/40 outline-none cursor-pointer"
        >
          {LOCATIONS.map(l => <option key={l}>{l}</option>)}
        </select>

        {/* Min Rating */}
        <select
          value={minRating}
          onChange={e => setMinRating(Number(e.target.value))}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-brand-border/60 bg-white text-brand-muted hover:border-brand-primary/40 outline-none cursor-pointer"
        >
          {MIN_RATINGS.map(r => (
            <option key={r} value={r}>{r === 0 ? "Any Rating" : `${r}★+`}</option>
          ))}
        </select>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 bg-white rounded-xl border border-brand-border/50 p-1 w-fit">
        {["brands", "products"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              tab === t
                ? "bg-brand-primary text-white shadow-sm"
                : "text-brand-muted hover:text-brand-dark"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Brands grid */}
      {tab === "brands" && (
        filteredBrands.length === 0
          ? <EmptyState message="No brands match your filters." />
          : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredBrands.map(brand => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  isSaved={saved.includes(brand.id)}
                  onToggleSave={toggleSave}
                />
              ))}
            </div>
          )
      )}

      {/* Products grid */}
      {tab === "products" && (
        filteredProducts.length === 0
          ? <EmptyState message="No products match your filters." />
          : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <LayoutGrid className="w-10 h-10 text-brand-border" />
      <p className="text-brand-muted text-sm font-medium">{message}</p>
      <p className="text-xs text-brand-muted">Try adjusting your search or filter settings.</p>
    </div>
  );
}
