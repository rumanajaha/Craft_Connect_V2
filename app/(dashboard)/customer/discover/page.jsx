"use client";

import React, { useState, useEffect } from "react";
import { Search, SlidersHorizontal, LayoutGrid } from "lucide-react";
import BrandCard from "@/components/customer/BrandCard";
import ProductCard from "@/components/customer/ProductCard";
import { useSavedBrands } from "@/hooks/useSavedBrands";

const CATEGORIES = ["All", "Ceramics", "Textiles", "Woodwork", "Apothecary", "Lighting", "Jewelry", "Leatherwork"];
const MIN_RATINGS = [0, 3, 4, 4.5, 4.8];

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <LayoutGrid className="w-9 h-9 text-brand-border" />
      <p className="text-sm text-brand-muted">{message}</p>
    </div>
  );
}

export default function DiscoverPage() {
  const [tab, setTab] = useState("brands");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [location, setLocation] = useState("All Locations");
  const [minRating, setMinRating] = useState(0);

  const [locations, setLocations] = useState(["All Locations"]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const { savedIds, hydrateSaved, toggleSave } = useSavedBrands();

  // Fetch distinct real BrandProfile.location values for dropdown
  useEffect(() => {
    async function loadLocations() {
      try {
        const res = await fetch("/api/discover/locations");
        if (res.ok) {
          const data = await res.json();
          setLocations(["All Locations", ...(data.locations || [])]);
        }
      } catch (err) {
        console.error("Failed to load locations:", err);
      }
    }
    loadLocations();
  }, []);

  // Query GET /api/discover whenever filters or tab change
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("tab", tab);
        if (query.trim()) params.set("q", query.trim());
        if (category !== "All") params.set("category", category);
        if (location !== "All Locations") params.set("location", location);
        if (minRating > 0) params.set("minRating", String(minRating));

        const res = await fetch(`/api/discover?${params.toString()}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (tab === "products") {
            setProducts(data.products || []);
          } else {
            setBrands(data.brands || []);
          }
          hydrateSaved(data.savedBrandIds || [], data.stats?.savedBrands);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to load discover results:", err);
        }
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [tab, query, category, location, minRating, hydrateSaved]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-dark">Discover</h1>
        <p className="text-brand-muted text-sm mt-1">Find handcrafted brands and products made by independent makers.</p>
      </div>

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

      <div className="flex flex-wrap gap-3 items-center">
        <SlidersHorizontal className="w-4 h-4 text-brand-muted shrink-0" />

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

        <select
          value={location}
          onChange={e => setLocation(e.target.value)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-brand-border/60 bg-white text-brand-muted hover:border-brand-primary/40 outline-none cursor-pointer"
        >
          {locations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>

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

      {loading ? (
        <div className="py-16 text-center text-sm text-brand-muted">Loading {tab}…</div>
      ) : (
        <>
          {tab === "brands" && (
            brands.length === 0
              ? <EmptyState message="No brands match your filters." />
              : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {brands.map(brand => (
                    <BrandCard
                      key={brand.id}
                      brand={brand}
                      isSaved={savedIds.includes(brand.id)}
                      onToggleSave={(id) => toggleSave(id)}
                    />
                  ))}
                </div>
              )
          )}

          {tab === "products" && (
            products.length === 0
              ? <EmptyState message="No products match your filters." />
              : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )
          )}
        </>
      )}
    </div>
  );
}
