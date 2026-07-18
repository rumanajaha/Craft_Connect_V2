"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, LayoutGrid, Loader2 } from "lucide-react";
import BrandCard from "@/components/customer/BrandCard";
import ProductCard from "@/components/customer/ProductCard";

const CATEGORIES = ["All", "Ceramics", "Textiles", "Woodwork", "Apothecary", "Lighting"];
const MIN_RATINGS = [0, 3, 4, 4.5, 4.8];

export default function DiscoverPage() {
  const [locationsList, setLocationsList] = useState(["All Locations"]);
  const [tab, setTab]           = useState("brands");      
  const [query, setQuery]       = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [location, setLocation] = useState("All Locations");
  const [minRating, setMinRating] = useState(0);
  const [saved, setSaved]       = useState([]);

  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounce query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Load Saved Brand IDs
  useEffect(() => {
    async function loadSaved() {
      try {
        const res = await fetch("/api/customer/saved-brands");
        if (res.ok) {
          const data = await res.json();
          setSaved((data.savedBrands || []).map(b => b.id));
        }
      } catch (err) {
        console.error("Failed to load saved brand IDs:", err);
      }
    }
    loadSaved();
  }, []);

  // Fetch Discover data
  useEffect(() => {
    async function fetchDiscover() {
      setLoading(true);
      try {
        const url = `/api/discover?tab=${tab}&q=${encodeURIComponent(debouncedQuery)}&category=${encodeURIComponent(category)}&location=${encodeURIComponent(location)}&minRating=${minRating}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.locations) {
            setLocationsList(data.locations);
          }
          if (tab === "brands") {
            setBrands(data.brands || []);
          } else {
            setProducts(data.products || []);
          }
        }
      } catch (err) {
        console.error("Discover fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDiscover();
  }, [tab, debouncedQuery, category, location, minRating]);

  const toggleSave = useCallback((id) => {
    const isCurrentlySaved = saved.includes(id);
    const method = isCurrentlySaved ? "DELETE" : "POST";
    const url = isCurrentlySaved 
      ? `/api/customer/saved-brands?brandId=${id}`
      : `/api/customer/saved-brands`;
    
    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: isCurrentlySaved ? undefined : JSON.stringify({ brandId: id })
    }).catch(err => {
      console.error("Failed to toggle save:", err);
    });

    setSaved(prev => isCurrentlySaved ? prev.filter(b => b !== id) : [...prev, id]);
  }, [saved]);

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
          {locationsList.map(l => <option key={l}>{l}</option>)}
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
        <div className="flex flex-col items-center justify-center py-20 text-brand-muted gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          <span className="text-xs font-semibold">Loading results...</span>
        </div>
      ) : (
        <>
          {tab === "brands" && (
            brands.length === 0
              ? <EmptyState message="No brands match your filters." />
              : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
                  {brands.map(brand => (
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

          {tab === "products" && (
            products.length === 0
              ? <EmptyState message="No products match your filters." />
              : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in duration-200">
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

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <LayoutGrid className="w-10 h-10 text-brand-border" />
      <p className="text-brand-muted text-sm font-medium">{message}</p>
      <p className="text-xs text-brand-muted">Try adjusting your search or filter settings.</p>
    </div>
  );
}
