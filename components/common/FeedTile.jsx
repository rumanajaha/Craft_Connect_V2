"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Eye, Sparkles } from "lucide-react";


export default function FeedTile({ item, viewerRole, isWide }) {
  const [hovered, setHovered] = useState(false);

  
  const getImageSrc = () => {
    if (item.type === "product") return item.image;
    if (item.type === "creator_content") return item.portfolioImage;
    if (item.type === "brand_update") {
      
      return item.bannerImage || item.brandLogo;
    }
    return null;
  };

  
  const getHref = () => {
    if (item.type === "product") {
      if (viewerRole === "brand") return "/brand/profile";
      return `/customer/brand/${item.brandId}`;
    }
    if (item.type === "brand_update") {
      if (viewerRole === "brand") return "/brand/profile";
      return `/customer/brand/${item.brandId}`;
    }
    if (item.type === "creator_content") {
      if (viewerRole === "brand" || viewerRole === "customer") return "/creator/profile";
      return "/creator/profile";
    }
    return "#";
  };

  
  const getPrimaryLabel = () => {
    if (item.type === "product") return item.name;
    if (item.type === "brand_update") return item.brandName;
    if (item.type === "creator_content") return item.creatorName;
    return "";
  };

  
  const getSecondaryLabel = () => {
    if (item.type === "product") return `${item.brandName} · $${item.price}`;
    if (item.type === "brand_update") {
      const updateType = item.updateType === "story" ? "Published a brand story" : "Updated their catalog";
      return updateType;
    }
    if (item.type === "creator_content") return item.caption?.slice(0, 60) + (item.caption?.length > 60 ? "…" : "");
    return "";
  };

  const isCreatorOrVideo = item.type === "creator_content";

  const imgSrc = getImageSrc();
  if (!imgSrc) return null;

  return (
    <Link
      href={getHref()}
      className={`relative block overflow-hidden rounded-lg bg-brand-border/20 group cursor-pointer ${isWide ? "col-span-2" : ""}`}
      style={{ aspectRatio: isWide ? "2 / 1" : "1 / 1" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      
      <Image
        src={imgSrc}
        alt={getPrimaryLabel()}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        unoptimized
      />

      
      {isCreatorOrVideo && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
        </div>
      )}

      
      {item.reason && hovered && (
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 pointer-events-none">
          <Sparkles className="w-2.5 h-2.5 text-amber-300" />
          {item.reason}
        </div>
      )}

      
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 pb-3 pt-8 transition-opacity duration-200 ${
          hovered ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="text-white text-xs font-bold leading-snug line-clamp-1">{getPrimaryLabel()}</p>
        <p className="text-white/70 text-[10px] leading-snug line-clamp-1 mt-0.5">{getSecondaryLabel()}</p>
      </div>

      
      {item.views && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white/70 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <Eye className="w-3 h-3" />
          {item.views >= 1000 ? `${(item.views / 1000).toFixed(1)}k` : item.views}
        </div>
      )}
    </Link>
  );
}
