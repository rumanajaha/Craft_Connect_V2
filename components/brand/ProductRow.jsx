"use client";

import React from "react";
import Image from "next/image";
import Button from "@/components/ui/button";
import { Edit2, Trash2, ExternalLink } from "lucide-react";

export default function ProductRow({ product, onEdit, onDelete }) {
  const isAvailable = product.inStock !== false;

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 items-start sm:items-center bg-white border border-brand-border/50 rounded-2xl hover:shadow-sm transition-shadow">
      {/* Product Image & Basic Info */}
      <div className="flex items-center gap-4 w-full sm:w-2/5 shrink-0">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-brand-border/40 shrink-0 bg-brand-border/20">
          {product.image ? (
            <Image src={product.image} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-brand-muted">No img</div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-brand-dark truncate">{product.name}</p>
          <p className="text-sm text-brand-dark/70 font-medium mt-0.5">${product.price}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="w-full sm:w-1/5 shrink-0">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
          isAvailable 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {isAvailable ? "In Stock" : "Out of Stock"}
        </span>
      </div>

      {/* Buy Link (mock display) */}
      <div className="flex-1 w-full min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-brand-muted truncate cursor-not-allowed" title="External link (mock)">
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{product.buyLink || "https://example.com/product"}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit && onEdit(product)}
          className="text-brand-dark/70"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete && onDelete(product.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
