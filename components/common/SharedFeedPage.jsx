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
  const [searchQuery, setSearchQuery] = useState("");
  const loaderRef = useRef(null);

  // Brand Owner Server-side state
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);

  // Fetch logic for brand role
  useEffect(() => {
    if (role !== "brand") return;

    let active = true;
    const fetchFeed = async () => {
      try {
        setIsLoading(page === 1);
        setIsMoreLoading(page > 1);

        const endpoint = searchQuery.trim()
          ? `/api/brand/feed/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=${PAGE_SIZE}`
          : `/api/brand/feed?page=${page}&limit=${PAGE_SIZE}`;

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("Failed to fetch feed");
        const data = await res.json();

        if (active) {
          if (page === 1) {
            setItems(data.items || []);
          } else {
            setItems(prev => [...prev, ...(data.items || [])]);
          }
          setHasMore(data.hasMore || false);
        }
      } catch (err) {
        console.error("Error loading feed:", err);
      } finally {
        if (active) {
          setIsLoading(false);
          setIsMoreLoading(false);
        }
      }
    };

    fetchFeed();
    return () => { active = false; };
  }, [role, page, searchQuery]);

  useEffect(() => {
    if (role === "brand") {
      setPage(1);
    }
  }, [searchQuery, role]);

  const clientRawItems = useMemo(() => getFeedItems(), []);
  const clientItemsWithPinnedDiversity = useMemo(
    () => clientRawItems.map(item => ({ ...item, diversityBonus: Math.random() * 0.1 })),
    [clientRawItems]
  );
  const clientRankedItems = useMemo(
    () => rankFeed(clientItemsWithPinnedDiversity, role, userTags),
    [clientItemsWithPinnedDiversity, role, userTags]
  );
  const clientFilteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clientRankedItems;
    return clientRankedItems.filter(item => {
      const name = (item.name || item.updateText || item.caption || "").toLowerCase();
      const brand = (item.brandName || item.creatorName || "").toLowerCase();
      const tags = (item.ai_tags || []).join(" ").toLowerCase();
      return name.includes(q) || brand.includes(q) || tags.includes(q);
    });
  }, [clientRankedItems, searchQuery]);

  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (role !== "brand") {
      setDisplayCount(PAGE_SIZE);
    }
  }, [searchQuery, role]);

  useEffect(() => {
    if (role !== "brand") {
      setIsLoading(true);
      const t = setTimeout(() => setIsLoading(false), 400);
      return () => clearTimeout(t);
    }
  }, [role]);

  const visibleItems = role === "brand" ? items : clientFilteredItems.slice(0, displayCount);
  const showLoader = role === "brand" ? hasMore : displayCount < clientFilteredItems.length;

  const handleObserver = useCallback((entries) => {
    if (entries[0].isIntersecting) {
      if (role === "brand") {
        if (hasMore && !isMoreLoading) {
          setPage(prev => prev + 1);
        }
      } else {
        if (displayCount < clientFilteredItems.length) {
          setDisplayCount(prev => Math.min(prev + PAGE_SIZE, clientFilteredItems.length));
        }
      }
    }
  }, [role, hasMore, isMoreLoading, displayCount, clientFilteredItems.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [handleObserver]);

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
      ) : visibleItems.length === 0 ? (
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
            {showLoader && (
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
            {!showLoader && visibleItems.length > 0 && (
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
