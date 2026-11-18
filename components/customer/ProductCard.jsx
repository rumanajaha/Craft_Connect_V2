"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import ProductDetailModal from "@/components/common/ProductDetailModal";

export default function ProductCard({ product }) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [viewCount, setViewCount] = useState(product?.view_count || 0);

  const showImage = Boolean(product?.image) && !imgError;
  const initial = (product?.name?.trim()?.[0] || "P").toUpperCase();

  const handleCardClick = (e) => {
    e.preventDefault();
    setIsDetailOpen(true);
    if (product?.id) {
      fetch("/api/track-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "product", itemId: product.id }),
      })
        .then((res) => {
          if (res.ok) setViewCount((c) => c + 1);
        })
        .catch(() => {});
    }
  };

  return (
    <>
      <div onClick={handleCardClick} className="group block cursor-pointer">
        <div className="bg-white rounded-2xl border border-brand-border/50 shadow-sm hover:shadow-md hover:border-brand-primary/20 transition-all duration-300 overflow-hidden">
          <div className="relative aspect-square w-full overflow-hidden bg-brand-border/20 flex items-center justify-center">
            {showImage ? (
              <Image
                src={product.image}
                alt={product.name || "Product"}
                fill
                sizes="(max-width: 640px) 100vw, 250px"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="font-serif text-3xl font-bold text-brand-primary/60">
                {initial}
              </span>
            )}

            <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
              product.inStock
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}>
              {product.inStock
                ? <><CheckCircle className="w-2.5 h-2.5" /> In Stock</>
                : <><XCircle className="w-2.5 h-2.5" /> Out of Stock</>
              }
            </div>
          </div>

          <div className="p-3.5">
            {product.brandName && (
              <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">
                {product.brandName}
              </p>
            )}
            <h3 className="font-serif text-sm font-bold text-brand-dark group-hover:text-brand-primary transition-colors leading-snug line-clamp-2">
              {product.name}
            </h3>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-brand-dark">
                ${product.price}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-medium text-brand-muted">
                <Eye className="w-3.5 h-3.5" />
                {viewCount.toLocaleString()}
              </span>
            </div>

            {product.description && (
              <p className="text-[10px] text-brand-muted mt-1.5 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
            <p className="text-[10px] text-brand-muted mt-1">
              Click to view details →
            </p>
          </div>
        </div>
      </div>

      <ProductDetailModal
        product={product}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </>
  );
}
