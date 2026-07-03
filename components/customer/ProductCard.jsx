"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";
import { MOCK_BRANDS } from "@/lib/mockData";

export default function ProductCard({ product }) {
  const brand = MOCK_BRANDS.find(b => b.id === product.brandId);

  return (
    <Link href={`/customer/brand/${product.brandId}`} className="group block">
      <div className="bg-white rounded-2xl border border-brand-border/50 shadow-sm hover:shadow-md hover:border-brand-primary/20 transition-all duration-300 overflow-hidden">
        {/* Product Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-brand-border/20">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, 250px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Stock badge */}
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

        {/* Details */}
        <div className="p-3.5">
          <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">
            {brand?.name}
          </p>
          <h3 className="font-serif text-sm font-bold text-brand-dark group-hover:text-brand-primary transition-colors leading-snug line-clamp-2">
            {product.name}
          </h3>
          <p className="mt-2 text-sm font-bold text-brand-dark">
            ${product.price}
          </p>
          {product.description && (
            <p className="text-[10px] text-brand-muted mt-1.5 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
          <p className="text-[10px] text-brand-muted mt-1">
            Click to view brand →
          </p>
        </div>
      </div>
    </Link>
  );
}
