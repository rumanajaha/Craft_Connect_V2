"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { MOCK_BRANDS } from "@/lib/mockData";
import ProductDetailModal from "@/components/common/ProductDetailModal";

export default function ProductCard({ product }) {
  const brand = product.brandName 
    ? { name: product.brandName } 
    : (product.brand?.name ? { name: product.brand.name } : MOCK_BRANDS.find(b => b.id === product.brandId));
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleCardClick = (e) => {
    e.preventDefault();
    setIsDetailOpen(true);
  };

  return (
    <>
      <div onClick={handleCardClick} className="group block cursor-pointer">
        <div className="bg-white rounded-2xl border border-brand-border/50 shadow-sm hover:shadow-md hover:border-brand-primary/20 transition-all duration-300 overflow-hidden">
          
          <div className="relative aspect-square w-full overflow-hidden bg-brand-border/20">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 250px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
            />
            
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
            <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">
              {brand?.name}
            </p>
            <h3 className="font-serif text-sm font-bold text-brand-dark group-hover:text-brand-primary transition-colors leading-snug line-clamp-2">
              {product.name}
            </h3>
            
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-brand-dark">
                ${product.price}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-medium text-brand-muted">
                <Eye className="w-3.5 h-3.5" />
                {(product.view_count || 0).toLocaleString()}
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
