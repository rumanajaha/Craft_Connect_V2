"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Search, Sparkles, Loader2, MessageSquare, X } from "lucide-react";
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

  const [matchedUsers, setMatchedUsers] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isInitiatingChat, setIsInitiatingChat] = useState(false);

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
        const redirectUrl = currentUser.role === "BRANDOWNER"
          ? `/brand/messages?thread=${data.threadId}`
          : `/creator/messages?thread=${data.threadId}`;
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

      {/* Dynamic Profiles Section */}
      {searchQuery.trim() && (matchedUsers.length > 0 || isSearchingUsers) && (
        <div className="mb-8 bg-[#fbf9f6] border border-brand-border/50 rounded-2xl p-5 shadow-sm">
          <h3 className="font-serif text-xs font-bold text-brand-dark uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Matching Profiles & Accounts</span>
            {isSearchingUsers && (
              <span className="text-[10px] text-brand-primary lowercase animate-pulse">searching...</span>
            )}
          </h3>
          {isSearchingUsers && matchedUsers.length === 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-56 p-4 bg-white rounded-xl border border-brand-border/30 animate-pulse flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 bg-brand-border/20 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-brand-border/20 rounded w-2/3" />
                    <div className="h-2.5 bg-brand-border/20 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-brand-border/40 scrollbar-track-transparent">
              {matchedUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="w-56 p-4 bg-white rounded-xl border border-brand-border/50 flex items-center gap-3 shrink-0 text-left hover:border-brand-primary/50 hover:shadow-sm transition-all focus:outline-none"
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-brand-border/40 shrink-0 bg-brand-border/10">
                    {user.avatar_url || user.logo_url ? (
                      <img src={user.avatar_url || user.logo_url} alt={user.name} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-muted font-bold text-xs bg-brand-border/20 uppercase">
                        {user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-brand-dark truncate">{user.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        user.profileType === 'brand' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {user.profileType}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-brand-border/40 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-brand-border/40 flex items-start justify-between bg-[#fbf9f6]">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0 bg-brand-border/20">
                  {selectedUser.avatar_url || selectedUser.logo_url ? (
                    <img src={selectedUser.avatar_url || selectedUser.logo_url} alt={selectedUser.name} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-muted font-bold text-xl uppercase bg-brand-border/20">
                      {selectedUser.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-brand-dark leading-snug">{selectedUser.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      selectedUser.profileType === 'brand' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {selectedUser.profileType}
                    </span>
                    {selectedUser.category && (
                      <span className="text-[10px] text-brand-muted font-semibold">
                        • {selectedUser.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-brand-muted hover:bg-brand-border/20 hover:text-brand-dark transition-all cursor-pointer focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[50vh]">
              {selectedUser.location && (
                <div>
                  <h4 className="text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-1">Location</h4>
                  <p className="text-sm text-brand-dark font-medium">{selectedUser.location}</p>
                </div>
              )}

              {(selectedUser.bio || selectedUser.description) && (
                <div>
                  <h4 className="text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-1">About</h4>
                  <p className="text-sm text-brand-muted leading-relaxed font-sans font-medium whitespace-pre-line">
                    {selectedUser.bio || selectedUser.description}
                  </p>
                </div>
              )}

              {selectedUser.ai_tags && selectedUser.ai_tags.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-brand-dark uppercase tracking-wider mb-2">Topic Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.ai_tags.map(tag => (
                      <span key={tag} className="inline-block px-2.5 py-1 rounded-full bg-brand-border/30 text-brand-dark/80 text-[10px] font-bold uppercase tracking-wider">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-brand-border/40 bg-[#fbf9f6] flex gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-brand-border/80 text-brand-dark font-bold text-sm hover:bg-brand-border/10 transition-colors focus:outline-none cursor-pointer text-center"
              >
                Close
              </button>
              {currentUser && currentUser.id !== selectedUser.owner_user_id && (
                <button
                  onClick={() => handleStartChat(selectedUser)}
                  disabled={isInitiatingChat}
                  className="flex-1 py-3 px-4 rounded-xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-secondary transition-colors focus:outline-none flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-brand-primary/60 shadow-sm"
                >
                  {isInitiatingChat ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" /> Message Profile
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}


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
