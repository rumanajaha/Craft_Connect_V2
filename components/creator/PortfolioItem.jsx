"use client";

import React from "react";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";

export default function PortfolioItem({ item, onEdit, onRemove }) {
  return (
    <div className="group relative bg-white border border-brand-border/50 rounded-2xl overflow-hidden hover:shadow-md transition-all">
      {/* Image */}
      <div className="relative w-full h-40 bg-brand-border/20">
        <Image src={item.image} alt={item.brandName} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">{item.brandName}</p>
        <p className="text-sm text-brand-dark leading-relaxed line-clamp-2">{item.description}</p>
      </div>

      {/* Actions (hover) */}
      {(onEdit || onRemove) && (
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button onClick={() => onEdit(item)} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow text-brand-muted hover:text-brand-dark transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onRemove && (
            <button onClick={() => onRemove(item.id)} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow text-brand-muted hover:text-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
