"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Eye, ExternalLink, ShoppingBag, Info, AlertCircle } from "lucide-react";

export default function ProductDetailModal({ product, isOpen, onClose }) {
  const [localViews, setLocalViews] = useState(product?.view_count || 0);

  useEffect(() => {
    if (product) {
      setLocalViews(product.view_count || 0);
    }
  }, [product]);

  useEffect(() => {
    if (!isOpen || !product?.id) return;

    const storageKey = `viewed_product_${product.id}`;
    const alreadyViewed = sessionStorage.getItem(storageKey);

    if (!alreadyViewed) {
      sessionStorage.setItem(storageKey, "true");
      setLocalViews(prev => prev + 1);

      fetch("/api/track-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "product", itemId: product.id }),
      }).catch(err => {
        console.error("Failed to track view for product:", product.id, err);
      });
    }
  }, [isOpen, product?.id]);

  if (!isOpen || !product) return null;

  const isAvailable = product.inStock !== false && product.status !== "out_of_stock" && product.status !== "sold_out";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left/Top: Image Section */}
        <div className="relative w-full md:w-1/2 h-64 md:h-auto bg-brand-border/20">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-brand-muted text-sm gap-2">
              <ShoppingBag className="w-8 h-8 opacity-40" />
              <span>No Image Available</span>
            </div>
          )}
          
          {/* Mobile close button */}
          <button 
            onClick={onClose}
            className="md:hidden absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow text-brand-dark hover:bg-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Right/Bottom: Content Section */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div className="relative">
            {/* Desktop close button */}
            <button 
              onClick={onClose}
              className="hidden md:flex absolute -top-4 -right-4 w-8 h-8 rounded-full bg-brand-border/10 hover:bg-brand-border/20 items-center justify-center text-brand-muted hover:text-brand-dark transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {product.category && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full inline-block mb-3">
                {product.category}
              </span>
            )}
            
            <h2 className="font-serif text-2xl font-bold text-brand-dark leading-snug">
              {product.name}
            </h2>

            <div className="flex items-center gap-4 mt-3">
              <span className="text-xl font-bold text-brand-dark">
                ${product.price}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                isAvailable
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}>
                {isAvailable ? "In Stock" : "Out of Stock"}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="my-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark/80 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-brand-muted" /> Description
            </h3>
            <p className="text-sm text-brand-muted leading-relaxed font-sans">
              {product.description || "No description provided for this product."}
            </p>
          </div>

          {/* Footer stats & Action */}
          <div className="pt-6 border-t border-brand-border/30 space-y-4">
            <div className="flex items-center gap-4 text-brand-muted text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>{localViews.toLocaleString()} views</span>
              </span>
            </div>

            {product.buyLink && (
              <a
                href={product.buyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-secondary transition-colors flex items-center justify-center gap-2 shadow-md shadow-brand-primary/10 hover:shadow-lg active:scale-[0.99] origin-center"
              >
                <ShoppingBag className="w-4 h-4" />
                Buy / View Product Store
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
