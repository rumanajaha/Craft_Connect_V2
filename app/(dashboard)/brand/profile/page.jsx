"use client";

import React, { useState } from "react";
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
  const router = useRouter();

  const { brandInfo, products: contextProducts, activeBrandId } = useBrandData();
  const id = activeBrandId; 
  const isActiveBrand = true; 

  
  const brandFromMock = MOCK_BRANDS.find(b => b.id === id);
  const collabs = MOCK_COLLABS.filter(c => c.brandId === id);

  
  const brand = brandInfo ? {
    ...brandFromMock,
    name: brandInfo.name,
    category: brandInfo.category,
    location: brandInfo.location,
    website: brandInfo.website,
    banner: brandInfo.videoUrl,
    about: brandInfo.description,
    tags: brandInfo.tags ? brandInfo.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
  } : brandFromMock;

  
  const products = contextProducts;
  const aboutText = brand.about;

  const [isSaved, setIsSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [requestType, setRequestType] = useState("Custom Product");
  const [message, setMessage]       = useState("");
  const [budget, setBudget]         = useState("");
  const [deadline, setDeadline]     = useState("");
  const [sending, setSending]       = useState(false);

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand-muted">
        <p className="text-lg font-serif font-bold text-brand-dark">Brand not found</p>
        <Link href="/customer/discover" className="text-brand-primary text-sm mt-2 hover:underline">← Back to Discover</Link>
      </div>
    );
  }

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
      
      <div className="relative w-full h-52 md:h-64 rounded-2xl overflow-hidden bg-brand-border/20">
        {isActiveBrand && brand.banner ? (
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover"
            src={brand.banner}
          />
        ) : (
          <Image src={brandFromMock.banner} alt={brand.name} fill sizes="100vw" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        
        <button
          onClick={() => setIsSaved(s => !s)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
        >
          {isSaved
            ? <BookmarkCheck className="w-5 h-5 text-brand-primary" />
            : <Bookmark className="w-5 h-5 text-brand-muted" />
          }
        </button>

        
        <div className="absolute bottom-4 left-5 flex items-end gap-3">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md bg-white">
            <Image src={brand.logo} alt={brand.name} fill sizes="64px" className="object-cover" />
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

      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          
          <div className="flex items-center gap-1.5">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`w-4 h-4 ${i <= Math.floor(brand.rating) ? "text-amber-400 fill-amber-400" : "text-brand-border"}`} />
            ))}
            <span className="text-sm font-bold text-brand-dark ml-1">{brand.rating}</span>
            <span className="text-xs text-brand-muted">({brand.reviewsCount} reviews)</span>
          </div>

          
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-xs font-bold text-emerald-700">Trust Score {brand.trustScore}%</span>
          </div>

          
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-full">
            {brand.category}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={brand.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-primary transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Visit Website
          </a>
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-brand-border/50 p-6 shadow-sm">
        <h2 className="font-serif text-lg font-bold text-brand-dark mb-3">About the Brand</h2>
        <p className="text-sm text-brand-muted leading-relaxed mb-4">{aboutText}</p>
        {brand.tags && brand.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-brand-border/40">
            {brand.tags.map(tag => (
              <span key={tag} className="inline-block px-2.5 py-1 rounded-full bg-brand-border/20 text-brand-dark text-xs font-semibold">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </section>

      
      {products.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-bold text-brand-dark mb-4">Featured Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      
      {collabs.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-bold text-brand-dark mb-4">Past Creator Collaborations</h2>
          <div className="flex flex-wrap gap-3">
            {collabs.map(c => (
              <div key={c.id} className="flex items-center gap-3 bg-white rounded-xl border border-brand-border/50 px-4 py-3 shadow-sm">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-border/20 shrink-0">
                  <Image src={c.creatorAvatar} alt={c.creatorName} width={32} height={32} className="object-cover w-full h-full" />
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
