"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Search, Sparkles } from "lucide-react";
import FeedTile from "@/components/common/FeedTile";
import { getFeedItems, rankFeed } from "@/lib/feedRanking";

const PAGE_SIZE = 12; // Tiles per page (divisible by 4 columns)

// Skeleton tile for loading state — matches grid cell sizes
function SkeletonTile({ isWide }) {
  return (
    <div
      className={`rounded-lg bg-brand-border/20 animate-pulse ${isWide ? "col-span-2" : ""}`}
      style={{ aspectRatio: isWide ? "2 / 1" : "1 / 1" }}
    />
  );
}

/**
 * Returns whether a tile at position `index` (within its current page/batch)
 * should receive a 2-column "wide" span.
 *
 * Rule: the FIRST item in each batch of 8 gets the wide treatment.
 * This creates a repeating rhythm of [1 wide + 7 standard] per visual group.
 */
function isWideTile(globalIndex) {
  return globalIndex % 8 === 0;
}

/**
 * SharedFeedPage — Masonry-style explore grid for the personalised home feed.
 * Layout: 4-col desktop, 3-col tablet, 2-col mobile. 3px gaps. Edge-to-edge tiles.
 * Scoring/ranking logic lives entirely in feedRanking.js (unchanged).
 *
 * @param {string} role         - "customer" | "brand" | "creator"
 * @param {string[]} userTags   - Viewer's preference tags/niches for tag-affinity scoring
 * @param {string} heading      - Page heading text
 * @param {string} subheading   - Page subheading text
 * @param {string} emptyStatePrompt  - Shown when feed is empty
 */
export default function SharedFeedPage({ role, userTags = [], heading, subheading, emptyStatePrompt }) {
  const [isLoading, setIsLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState("");
  const loaderRef = useRef(null);

  // ─── Data ───────────────────────────────────────────────────────────────
  // Raw items fetched once at mount (includes localStorage updates from BrandDataContext actions)
  const rawItems = useMemo(() => getFeedItems(), []);

  // Diversity bonuses pinned ONCE per page-load — not recalculated on re-render.
  // This prevents the grid from shuffling when the user types, likes, or clicks.
  const itemsWithPinnedDiversity = useMemo(
    () => rawItems.map(item => ({ ...item, diversityBonus: Math.random() * 0.1 })),
    [rawItems] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Full ranked list (memoized — only changes if rawItems changes)
  const rankedItems = useMemo(
    () => rankFeed(itemsWithPinnedDiversity, role, userTags),
    [itemsWithPinnedDiversity, role] // userTags intentionally stable for session
  );

  // ─── Search filter ──────────────────────────────────────────────────────
  // Client-side filter by item name / brand name / tags — resets display count on change
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

  // Reset display count when search changes
  useEffect(() => { setDisplayCount(PAGE_SIZE); }, [searchQuery]);

  // ─── Skeleton ───────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  // ─── Infinite scroll ────────────────────────────────────────────────────
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

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-primary" />
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-brand-dark">{heading}</h1>
          </div>
          <p className="text-brand-muted text-xs mt-1 max-w-xl">{subheading}</p>
        </div>

        {/* Search bar — reuses CraftConnect's light theme styling */}
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

      {/* Grid — 4 cols desktop, 3 tablet, 2 mobile. 3px gap. */}
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
          {/* NOTE on background color: keeping CraftConnect's existing light cream theme here.
              A dark explore-style background (like Instagram Explore) would clash with the
              dashboard sidebar and top-bar chrome. If a dark mode is specifically wanted for
              this page, set `bg-zinc-950` on the outer div and invert the text tokens —
              flag this with the design team before implementing. */}
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

          {/* Infinite scroll sentinel */}
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
