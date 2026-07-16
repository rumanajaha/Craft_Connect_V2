"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback, useContext } from "react";
import { Search, Sparkles, Loader2, MessageSquare, X, Handshake } from "lucide-react";
import FeedTile from "@/components/common/FeedTile";
import { getFeedItems, rankFeed } from "@/lib/feedRanking";
import { CollabContext } from "@/lib/collabStore";
import ProposeCollabModal from "@/components/creator/ProposeCollabModal";

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


function ProfileSearchTile({ user, viewerRole, onStartChat, onProposeCollab }) {
  const [hovered, setHovered] = useState(false);

  const isBrand = user.profileType === "brand";
  const label = isBrand ? "Brand" : "Creator";
  const badgeColor = isBrand
    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
    : "bg-purple-50 text-purple-700 border border-purple-200/50";

  // Show "Propose Collaboration" action for brand-to-creator or creator-to-brand contexts only.
  const showPropose =
    (viewerRole === "brand" && user.profileType === "creator") ||
    (viewerRole === "creator" && user.profileType === "brand");

  const avatar = user.avatar_url || user.logo_url;

  return (
    <div
      className="relative block overflow-hidden rounded-lg bg-brand-border/20 group aspect-square select-none cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background Image / Placeholder */}
      {avatar ? (
        <img
          src={avatar}
          alt={user.name}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-brand-muted font-bold text-3xl bg-brand-border/20 uppercase">
          {user.name?.charAt(0) || "?"}
        </div>
      )}

      {/* Role Badge in top-left */}
      <div className="absolute top-2.5 left-2.5 pointer-events-none z-10">
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm ${badgeColor}`}>
          {label}
        </span>
      </div>

      {/* Info & Action Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-3 pt-12 flex flex-col justify-end transition-all duration-300 z-10">
        <p className="text-white text-xs font-bold leading-snug truncate">
          {user.name}
        </p>
        {(user.category || user.niche) && (
          <p className="text-white/70 text-[9px] leading-snug truncate mt-0.5 font-medium">
            {user.category || user.niche} {user.location ? `· ${user.location}` : ""}
          </p>
        )}

        {/* Action Buttons overlay */}
        <div
          className={`flex gap-1.5 mt-2 transition-all duration-300 origin-bottom ${hovered ? "opacity-100 translate-y-0 h-auto" : "opacity-0 translate-y-2 h-0 overflow-hidden"
            }`}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onStartChat(user);
            }}
            className="flex-1 py-1.5 px-2 bg-brand-primary text-white rounded-lg text-[10px] font-bold hover:bg-brand-secondary transition-colors flex items-center justify-center gap-1 shadow-sm active:scale-[0.98]"
          >
            <MessageSquare className="w-3 h-3" />
            Message
          </button>
          {showPropose && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onProposeCollab(user);
              }}
              className="flex-1 py-1.5 px-2 bg-white/95 text-brand-dark rounded-lg text-[10px] font-bold hover:bg-white hover:text-brand-primary transition-all flex items-center justify-center gap-1 border border-brand-border/40 shadow-sm active:scale-[0.98]"
            >
              <Handshake className="w-3 h-3 text-brand-primary" />
              Propose
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


export default function SharedFeedPage({ role, userTags = [], heading, subheading, emptyStatePrompt }) {
  const collabCtx = useContext(CollabContext);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const loaderRef = useRef(null);

  const [matchedUsers, setMatchedUsers] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitiatingChat, setIsInitiatingChat] = useState(false);
  const [pitchTarget, setPitchTarget] = useState(null);

  // Brand Owner Server-side state
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);

  // Fetch current authenticated user
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    }
    fetchMe();
  }, []);

  // Fetch matched user profiles based on searchQuery
  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatchedUsers([]);
      return;
    }

    let active = true;
    const fetchUsers = async () => {
      try {
        setIsSearchingUsers(true);
        const res = await fetch(`/api/search/users?q=${encodeURIComponent(searchQuery)}&type=all`);
        if (res.ok && active) {
          const data = await res.json();
          setMatchedUsers(data.users || []);
        }
      } catch (err) {
        console.error("Error fetching matching users:", err);
      } finally {
        if (active) setIsSearchingUsers(false);
      }
    };

    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleStartChat = async (user) => {
    if (!currentUser) {
      alert("Please log in to send a message.");
      return;
    }
    setIsInitiatingChat(true);
    try {
      const recipientId = user.owner_user_id;
      if (!recipientId) {
        alert("No user ID associated with this profile.");
        return;
      }

      const res = await fetch("/api/brand/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId })
      });

      if (res.ok) {
        const data = await res.json();
        let redirectUrl = "";
        if (currentUser.role === "BRANDOWNER") {
          redirectUrl = `/brand/messages?thread=${data.threadId}`;
        } else if (currentUser.role === "CREATOR") {
          redirectUrl = `/creator/messages?thread=${data.threadId}`;
        } else {
          redirectUrl = `/customer/messages?thread=${data.threadId}`;
        }
        window.location.href = redirectUrl;
      } else {
        alert("Failed to start conversation.");
      }
    } catch (err) {
      console.error("Error starting chat:", err);
      alert("Error starting conversation.");
    } finally {
      setIsInitiatingChat(false);
    }
  };

  const handleProposeCollab = (user) => {
    setPitchTarget({
      id: user.id,
      name: user.name,
      logo: user.avatar_url || user.logo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      category: user.category || user.niche || (user.niches && user.niches[0]) || '',
      location: user.location || 'Online',
    });
  };

  // Fetch logic for brand role
  useEffect(() => {
    if (role !== "brand") return;
    if (searchQuery.trim()) return; // Skip feed fetching during active search

    let active = true;
    const fetchFeed = async () => {
      try {
        setIsLoading(page === 1);
        setIsMoreLoading(page > 1);

        const endpoint = `/api/brand/feed?page=${page}&limit=${PAGE_SIZE}`;

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

      {searchQuery.trim() ? (
        /* ═════════ SEARCH RESULTS GRID OVERLAY ═════════ */
        isSearchingUsers && matchedUsers.length === 0 ? (
          /* Searching state skeleton grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[3px]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg bg-brand-border/20 animate-pulse aspect-square"
              />
            ))}
          </div>
        ) : matchedUsers.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Sparkles className="w-10 h-10 text-brand-primary/20 mb-4" />
            <h3 className="font-serif text-lg font-bold text-brand-dark mb-2">
              No profiles found
            </h3>
            <p className="text-sm text-brand-muted max-w-xs">
              No brand or creator matches "{searchQuery}". Try a different term or hashtag.
            </p>
          </div>
        ) : (
          /* Search results grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[3px]">
            {matchedUsers.map((user) => (
              <ProfileSearchTile
                key={user.id}
                user={user}
                viewerRole={role}
                onStartChat={handleStartChat}
                onProposeCollab={handleProposeCollab}
              />
            ))}
          </div>
        )
      ) : (
        /* ═════════ NORMAL TRENDING / INSIGHTS FEED ═════════ */
        isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[3px]">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <SkeletonTile key={i} isWide={isWideTile(i)} />
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Sparkles className="w-10 h-10 text-brand-primary/20 mb-4" />
            <h3 className="font-serif text-lg font-bold text-brand-dark mb-2">
              Your feed is empty
            </h3>
            <p className="text-sm text-brand-muted max-w-xs">
              {emptyStatePrompt}
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
        )
      )}

      {pitchTarget && (
        <ProposeCollabModal
          isOpen={!!pitchTarget}
          onClose={() => setPitchTarget(null)}
          brand={pitchTarget}
          onSubmit={(pitch) => {
            if (collabCtx && collabCtx.addPitch) {
              collabCtx.addPitch(pitch);
            }
          }}
        />
      )}
    </div>
  );
}
