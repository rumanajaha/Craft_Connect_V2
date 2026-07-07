"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Search, Sparkles } from "lucide-react";
import FeedTile from "@/components/common/FeedTile";
import { getFeedItems, rankFeed } from "@/lib/feedRanking";

const PAGE_SIZE = 12; 


function SkeletonTile({ isWide }) {
  return (
    <div
      className={`rounded-lg bg-brand-border/20 animate-pulse ${isWide ? "col-span-2" : ""}`}
      style={{ aspectRatio: isWide ? "2 / 1" : "1 / 1" }}
    />
  );
}


function isWideTile(globalIndex) {
  return globalIndex % 8 === 0;
}


export default function SharedFeedPage({ role, userTags = [], heading, subheading, emptyStatePrompt }) {
  const [isLoading, setIsLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState("");
  const loaderRef = useRef(null);

  
  
  const rawItems = useMemo(() => getFeedItems(), []);

  
  
  const itemsWithPinnedDiversity = useMemo(
    () => rawItems.map(item => ({ ...item, diversityBonus: Math.random() * 0.1 })),
    [rawItems] 
  );

  
  const rankedItems = useMemo(
    () => rankFeed(itemsWithPinnedDiversity, role, userTags),
    [itemsWithPinnedDiversity, role] 
  );

  
  
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rankedItems;
    return rankedItems.filter(item => {
      const name = (item.name || item.updateText || item.caption || "").toLowerCase();
      const brand = (item.brandName || item.creatorName || "").toLowerCase();
      const tags = (item.ai_tags || []).join(" ").toLowerCase();
      return name.includes(q) || brand.includes(q) || tags.includes(q);
    });
  }, [rankedItems, searchQuery]);

  
  useEffect(() => { setDisplayCount(PAGE_SIZE); }, [searchQuery]);

  
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  
  const handleObserver = useCallback((entries) => {
    if (entries[0].isIntersecting && displayCount < filteredItems.length) {
      setDisplayCount(prev => Math.min(prev + PAGE_SIZE, filteredItems.length));
    }
  }, [displayCount, filteredItems.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.3 });
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [handleObserver]);

  const visibleItems = filteredItems.slice(0, displayCount);
  const hasMore = displayCount < filteredItems.length;

  
  return (
    <div className="max-w-6xl mx-auto">
      
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-primary" />
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-brand-dark">{heading}</h1>
          </div>
          <p className="text-brand-muted text-xs mt-1 max-w-xl">{subheading}</p>
        </div>

        
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, brand, or tag…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-brand-border/50 rounded-xl text-sm text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/10 transition-all shadow-sm"
          />
        </div>
      </div>

      
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[3px]">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <SkeletonTile key={i} isWide={isWideTile(i)} />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Sparkles className="w-10 h-10 text-brand-primary/20 mb-4" />
          <h3 className="font-serif text-lg font-bold text-brand-dark mb-2">
            {searchQuery ? "No results found" : "Your feed is empty"}
          </h3>
          <p className="text-sm text-brand-muted max-w-xs">
            {searchQuery
              ? `No items match "${searchQuery}". Try a different search.`
              : emptyStatePrompt}
          </p>
        </div>
      ) : (
        <>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[3px]">
            {visibleItems.map((item, index) => (
              <FeedTile
                key={item.id}
                item={item}
                viewerRole={role}
                isWide={isWideTile(index)}
              />
            ))}
          </div>

          
          <div ref={loaderRef} className="h-16 flex items-center justify-center">
            {hasMore && (
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
            {!hasMore && visibleItems.length > 0 && (
              <p className="text-[10px] text-brand-muted/50 font-medium tracking-widest uppercase">
                ✦ &nbsp; All caught up &nbsp; ✦
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
