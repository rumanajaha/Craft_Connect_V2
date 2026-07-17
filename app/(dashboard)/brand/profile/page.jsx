"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Star, MapPin, ExternalLink, Bookmark, BookmarkCheck } from "lucide-react";
import { useBrandData } from "@/lib/brandDataStore";
import ProductCard from "@/components/customer/ProductCard";

export default function BrandProfilePage() {
  const searchParams = useSearchParams();
  const urlId = searchParams.get("id");

  const { brandInfo } = useBrandData();

  // Determine the brand ID: prefer URL param, fall back to context profile id
  const brandId = urlId || brandInfo?.id || null;

  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function fetchBrandData() {
      // If we still don't have an id, try fetching via /api/brand/profile (own profile)
      if (!brandId) {
        try {
          setLoading(true);
          const ownRes = await fetch("/api/brand/profile");
          if (ownRes.ok) {
            const ownData = await ownRes.json();
            const p = ownData.profile;
            setBrand({
              id: p.id,
              name: p.name || '',
              category: p.category || '',
              location: p.location || '',
              website: p.website || '',
              logo: p.logoUrl || p.logo || '',
              banner: p.videoUrl || '',
              about: p.description || '',
              tags: p.tags ? p.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
              rating: p.rating ?? 4.9,
              reviewsCount: p.reviews ?? 0,
              trustScore: 100,
            });

            // Fetch products from the brand products endpoint
            const prodRes = await fetch("/api/brand/products");
            if (prodRes.ok) {
              const prodData = await prodRes.json();
              setProducts(prodData.products || []);
            }
          } else {
            throw new Error("Failed to load brand profile");
          }
        } catch (err) {
          console.error("Error fetching own brand profile:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Fetch from public endpoint using the brand id
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/brand/public/${brandId}`);
        if (!res.ok) {
          throw new Error("Failed to load brand profile");
        }
        const data = await res.json();

        setBrand(data.profile);
        setProducts(data.products || []);
        setCollabs(data.collabs || []);
      } catch (err) {
        console.error("Error fetching brand profile:", err);
        setError(err.message || "Failed to load brand details.");
      } finally {
        setLoading(false);
      }
    }
    fetchBrandData();
  }, [brandId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        <p className="text-brand-muted text-sm mt-3 font-semibold">Loading profile...</p>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand-muted">
        <p className="text-lg font-serif font-bold text-brand-dark">Brand not found</p>
        <p className="text-sm text-red-500 mt-1">{error || ''}</p>
        <Link href="/brand/settings" className="text-brand-primary text-sm mt-2 hover:underline">← Back to Settings</Link>
      </div>
    );
  }

  const aboutText = brand.about || brand.description || '';
  const brandTags = Array.isArray(brand.tags)
    ? brand.tags
    : (typeof brand.tags === 'string' ? brand.tags.split(",").map(t => t.trim()).filter(Boolean) : []);
  const logoUrl = brand.logoUrl || brand.logo || 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=400&auto=format&fit=crop&q=80';
  const bannerUrl = brand.banner || brand.videoUrl || '';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Banner */}
      <div className="relative w-full h-52 md:h-64 rounded-2xl overflow-hidden bg-brand-border/20">
        {bannerUrl ? (
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover"
            src={bannerUrl}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-purple-500/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Bookmark */}
        <button
          onClick={() => setIsSaved(s => !s)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
        >
          {isSaved
            ? <BookmarkCheck className="w-5 h-5 text-brand-primary" />
            : <Bookmark className="w-5 h-5 text-brand-muted" />
          }
        </button>

        {/* Logo + Name */}
        <div className="absolute bottom-4 left-5 flex items-end gap-3">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md bg-white">
            <Image 
              src={logoUrl} 
              alt={brand.name} 
              fill 
              sizes="64px" 
              className="object-cover" 
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=400&auto=format&fit=crop&q=80";
                e.currentTarget.srcset = "";
              }}
            />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-white leading-tight drop-shadow-sm">{brand.name}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3 h-3 text-white/80" />
              <span className="text-xs text-white/80">{brand.location || ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Rating */}
          <div className="flex items-center gap-1.5">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`w-4 h-4 ${i <= Math.floor(brand.rating || 0) ? "text-amber-400 fill-amber-400" : "text-brand-border"}`} />
            ))}
            <span className="text-sm font-bold text-brand-dark ml-1">{brand.rating || 0}</span>
            <span className="text-xs text-brand-muted">({brand.reviewsCount || 0} reviews)</span>
          </div>

          {/* Trust Score */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-xs font-bold text-emerald-700">Trust Score {brand.trustScore || 100}%</span>
          </div>

          {/* Category */}
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-full">
            {brand.category || ''}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {brand.website && (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-primary transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Visit Website
            </a>
          )}
        </div>
      </div>

      {/* About */}
      <section className="bg-white rounded-2xl border border-brand-border/50 p-6 shadow-sm">
        <h2 className="font-serif text-lg font-bold text-brand-dark mb-3">About the Brand</h2>
        <p className="text-sm text-brand-muted leading-relaxed mb-4">{aboutText}</p>
        {brandTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-brand-border/40">
            {brandTags.map(tag => (
              <span key={tag} className="inline-block px-2.5 py-1 rounded-full bg-brand-border/20 text-brand-dark text-xs font-semibold">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Products */}
      {products.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-bold text-brand-dark mb-4">Featured Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Past Collaborations */}
      {collabs.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-bold text-brand-dark mb-4">Past Creator Collaborations</h2>
          <div className="flex flex-wrap gap-3">
            {collabs.map(c => (
              <div key={c.id} className="flex items-center gap-3 bg-white rounded-xl border border-brand-border/50 px-4 py-3 shadow-sm">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-border/20 shrink-0">
                  {c.creatorAvatar ? (
                    <Image src={c.creatorAvatar} alt={c.creatorName} width={32} height={32} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-muted text-xs font-bold">
                      {c.creatorName?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-dark">{c.creatorName}</p>
                  <p className="text-[10px] text-brand-muted">{c.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
