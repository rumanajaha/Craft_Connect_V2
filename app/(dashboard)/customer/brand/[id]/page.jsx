"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Star, MapPin, ExternalLink, Bookmark, BookmarkCheck, X, Send } from "lucide-react";
import { MOCK_BRANDS, MOCK_PRODUCTS, MOCK_COLLABS } from "@/lib/mockData";
import { useBrandData } from "@/lib/brandDataStore";
import ProductCard from "@/components/customer/ProductCard";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

export default function BrandProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [requestType, setRequestType] = useState("Custom Product");
  const [message, setMessage]       = useState("");
  const [budget, setBudget]         = useState("");
  const [deadline, setDeadline]     = useState("");
  const [sending, setSending]       = useState(false);

  const { activeBrandId } = useBrandData();
  const isActiveBrand = id === activeBrandId;

  useEffect(() => {
    if (!id) return;
    async function fetchBrandData() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/brand/public/${id}`);
        if (!res.ok) {
          throw new Error("Failed to load brand profile");
        }
        const data = await res.json();

        setBrand(data.profile);
        setProducts(data.products || []);
        setCollabs(data.collabs || []);
      } catch (err) {
        console.error("Error fetching brand profile:", err);
        
        // Fallback to mock data if DB fetch fails (ensuring app doesn't break in dev)
        const brandFromMock = MOCK_BRANDS.find(b => b.id === id);
        if (brandFromMock) {
          setBrand({
            id: brandFromMock.id,
            name: brandFromMock.name,
            category: brandFromMock.category,
            location: brandFromMock.location,
            website: brandFromMock.website,
            logo: brandFromMock.logo,
            banner: brandFromMock.banner,
            about: brandFromMock.about || "",
            tags: brandFromMock.tags || [],
            rating: brandFromMock.rating || 4.9,
            reviewsCount: brandFromMock.reviewsCount || 0,
            trustScore: brandFromMock.trustScore || 100,
          });
          setProducts(MOCK_PRODUCTS.filter(p => p.brandId === id));
          setCollabs(MOCK_COLLABS.filter(c => c.brandId === id));
          setError(null);
        } else {
          setError(err.message || "Failed to load brand details.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchBrandData();
  }, [id]);

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
        <Link href="/customer/discover" className="text-brand-primary text-sm mt-2 hover:underline">← Back to Discover</Link>
      </div>
    );
  }

  const aboutText = brand.about || brand.description || "";
  const brandLogo = brand.logo || brand.logoUrl || "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=400&auto=format&fit=crop&q=80";
  const brandBanner = brand.banner || brand.videoUrl || "";
  const brandTags = Array.isArray(brand.tags) 
    ? brand.tags 
    : (typeof brand.tags === "string" ? brand.tags.split(",").map(t => t.trim()).filter(Boolean) : []);

  const handleSendRequest = () => {
    if (!message.trim()) return;
    setSending(true);
    
    setTimeout(() => {
      setSending(false);
      setShowModal(false);
      router.push(`/customer/messages?thread=thread-${brand.id}`);
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back link */}
      <Link href="/customer/discover" className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-primary transition-colors">
        ← Back to Discover
      </Link>

      {/* Banner */}
      <div className="relative w-full h-52 md:h-64 rounded-2xl overflow-hidden bg-brand-border/20">
        {brandBanner ? (
          brandBanner.includes(".mp4") || brandBanner.includes("video") ? (
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover"
              src={brandBanner}
            />
          ) : (
            <Image src={brandBanner} alt={brand.name} fill sizes="100vw" className="object-cover" unoptimized />
          )
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-purple-500/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Save button */}
        <button
          onClick={() => setIsSaved(s => !s)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
        >
          {isSaved
            ? <BookmarkCheck className="w-5 h-5 text-brand-primary" />
            : <Bookmark className="w-5 h-5 text-brand-muted" />
          }
        </button>

        {/* Logo + Info overlay */}
        <div className="absolute bottom-4 left-5 flex items-end gap-3">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md bg-white animate-in zoom-in-95 duration-200">
            <Image 
              src={brandLogo} 
              alt={brand.name} 
              fill 
              sizes="64px" 
              className="object-cover"
              unoptimized 
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
              <span className="text-xs text-white/80">{brand.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Rating stars */}
          <div className="flex items-center gap-1.5">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`w-4 h-4 ${i <= Math.floor(brand.rating) ? "text-amber-400 fill-amber-400" : "text-brand-border"}`} />
            ))}
            <span className="text-sm font-bold text-brand-dark ml-1">{brand.rating}</span>
            <span className="text-xs text-brand-muted">({brand.reviewsCount} reviews)</span>
          </div>

          {/* Trust score indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-xs font-bold text-emerald-700">Trust Score {brand.trustScore}%</span>
          </div>

          {/* Category tag */}
          {brand.category && (
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-full">
              {brand.category}
            </span>
          )}
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
          <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
            <Send className="w-4 h-4 mr-1.5" /> Send Request
          </Button>
        </div>
      </div>

      {/* About Section */}
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

      {/* Products Section */}
      {products.length > 0 && (
        <section className="animate-in fade-in duration-300">
          <h2 className="font-serif text-xl font-bold text-brand-dark mb-4">Featured Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Collaborations Section */}
      {collabs.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-bold text-brand-dark mb-4">Past Creator Collaborations</h2>
          <div className="flex flex-wrap gap-3">
            {collabs.map(c => (
              <div key={c.id} className="flex items-center gap-3 bg-white rounded-xl border border-brand-border/50 px-4 py-3 shadow-sm">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-border/20 shrink-0">
                  <Image src={c.creatorAvatar} alt={c.creatorName} width={32} height={32} className="object-cover w-full h-full" unoptimized />
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

      {/* Send Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-brand-muted hover:text-brand-dark">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-serif text-xl font-bold text-brand-dark">Send a Request</h2>
              <p className="text-xs text-brand-muted mt-1">to {brand.name}</p>
            </div>

            <div className="flex gap-2">
              {["Custom Product", "General Inquiry"].map(t => (
                <button
                  key={t}
                  onClick={() => setRequestType(t)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    requestType === t
                      ? "bg-brand-primary text-white border-brand-primary"
                      : "bg-white text-brand-muted border-brand-border/60"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-brand-dark/80 block mb-1.5">
                Message <span className="text-brand-primary">*</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your request in detail…"
                rows={4}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-brand-border/80 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 text-sm text-brand-dark placeholder-brand-muted/60 outline-none transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input id="budget" label="Budget (optional)" placeholder="e.g. $100–$200" value={budget} onChange={e => setBudget(e.target.value)} />
              <Input id="deadline" label="Deadline (optional)" placeholder="e.g. Aug 20" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>

            <Button variant="primary" size="md" className="w-full" isLoading={sending} onClick={handleSendRequest}>
              <Send className="w-4 h-4 mr-1.5" /> Send Request
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
