"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Send, ArrowLeft, MoreHorizontal, User, UserCheck,
  Sparkles, Loader2, Search, X, MessageCircle
} from "lucide-react";
import Button from "@/components/ui/button";
import { useRealtime } from "@/context/RealtimeProvider";

/**
 * MessagesView — Unified messaging component for Brand, Creator, and Customer portals.
 *
 * Props:
 *   currentRole: "brand" | "creator" | "customer"
 *
 * Features:
 *   - 100% database-driven inbox (no mock/placeholder data)
 *   - Sidebar displays only real MessageThread records
 *   - Search bar queries /api/search/users for new contacts
 *   - Optimistic message sending
 *   - Supabase Realtime for live updates
 *   - localStorage persistence for active thread
 *   - Empty states, loading states, error handling
 */
export default function MessagesView({ currentRole = "brand" }) {
  const { supabase } = useRealtime();

  // ─── State ────────────────────────────────────────────
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [mobileView, setMobileView] = useState("list");
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const messagesEndRef = useRef(null);

  // AI Analyzer
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  // Inbox search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState("messages");

  const [currentUserId, setCurrentUserId] = useState(null);

  // ─── LocalStorage key for persisting active thread ────
  const STORAGE_KEY = `craft_connect_active_thread_${currentRole}`;

  // ─── Fetch current user ID on mount ───────────────────
  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }
      } catch (err) {
        console.error("Error fetching user in MessagesView:", err);
      }
    }
    fetchUser();
  }, []);

  // ─── Load threads on mount ────────────────────────────
  useEffect(() => {
    async function loadThreads() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const response = await fetch("/api/messages");
        if (!response.ok) throw new Error("Failed to load conversations");
        const data = await response.json();
        const loadedThreads = data.threads || [];
        setThreads(loadedThreads);

        // Check URL params first, fallback to localStorage
        const params = new URLSearchParams(window.location.search);
        const urlThreadId = params.get("thread");
        const savedId = urlThreadId || localStorage.getItem(STORAGE_KEY);
        if (savedId) {
          const found = loadedThreads.find(t => t.id === savedId);
          if (found) {
            setActiveThread(found);
            setMobileView("chat");
          }
        }

        if (urlThreadId) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      } catch (err) {
        console.error("Error loading messages:", err);
        setLoadError("Could not load conversations. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    loadThreads();
  }, [STORAGE_KEY]);

  // ─── Persist active thread ID ─────────────────────────
  useEffect(() => {
    if (activeThread?.id) {
      localStorage.setItem(STORAGE_KEY, activeThread.id);
    }
  }, [activeThread?.id, STORAGE_KEY]);

  // ─── Load message history when thread is selected ─────
  useEffect(() => {
    if (!activeThread?.id) return;
    if (activeThread.messages) return; // already loaded

    async function loadMessages() {
      try {
        const res = await fetch(`/api/messages/${activeThread.id}`);
        if (res.ok) {
          const data = await res.json();
          setActiveThread(prev => {
            if (prev && prev.id === activeThread.id) {
              return { ...prev, messages: data.messages };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Error loading message history:", err);
      }
    }
    loadMessages();
  }, [activeThread?.id]);

  // ─── Supabase Realtime scoped messages subscription ──
  useEffect(() => {
    if (!activeThread?.id || !currentUserId) return;

    console.log(`[Realtime] Subscribing to messages-thread-${activeThread.id}`);
    const channel = supabase
      .channel(`messages-thread-${activeThread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `thread_id=eq.${activeThread.id}`,
        },
        (payload) => {
          const newMsg = payload.new;
          
          // Only append messages sent by the OTHER participant.
          // Messages we send ourselves are handled via the optimistic-then-reconciled flow.
          if (newMsg.sender_id === currentUserId) {
            console.log("[Realtime] Ignoring own message insertion payload", newMsg.id);
            return;
          }

          console.log("[Realtime] Received new message from other user:", newMsg.id);
          const formatted = {
            id: newMsg.id,
            sender: "them",
            text: newMsg.body,
            image: newMsg.attachment_url,
            timestamp: newMsg.created_at,
          };

          setActiveThread(prev => {
            if (prev && prev.id === newMsg.thread_id) {
              if (prev.messages?.some(m => m.id === newMsg.id)) return prev;
              return {
                ...prev,
                messages: [...(prev.messages || []), formatted],
              };
            }
            return prev;
          });

          // Update sidebar preview
          setThreads(prevThreads =>
            prevThreads.map(t => {
              if (t.id === newMsg.thread_id) {
                return {
                  ...t,
                  lastMessageText: newMsg.body,
                  lastMessageTime: "Just now",
                  unread: true,
                };
              }
              return t;
            })
          );
        }
      )
      .subscribe();

    return () => {
      console.log(`[Realtime] Unsubscribing from messages-thread-${activeThread.id}`);
      supabase.removeChannel(channel);
    };
  }, [activeThread?.id, currentUserId]);

  // ─── Supabase Realtime thread list subscription ───────
  useEffect(() => {
    if (!currentUserId) return;

    const refetchThreadList = async () => {
      try {
        const response = await fetch("/api/messages", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          setThreads(data.threads || []);
        }
      } catch (err) {
        console.error("Error refetching threads:", err);
      }
    };

    const threadsChannel = supabase
      .channel(`threads-user-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "MessageThread" },
        (payload) => {
          const newThread = payload.new || payload.old;
          if (
            newThread?.participant_a_id === currentUserId ||
            newThread?.participant_b_id === currentUserId
          ) {
            refetchThreadList();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(threadsChannel);
    };
  }, [currentUserId]);

  // ─── Scroll to bottom on new messages ─────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  // ─── Search with debounce ─────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/search/users?q=${encodeURIComponent(searchQuery)}&type=all`);
        if (res.ok && active) {
          const data = await res.json();
          // Exclude users who already have threads
          const activeRecipientIds = new Set(threads.map(t => t.recipientId).filter(Boolean));
          const filtered = (data.users || []).filter(u => !activeRecipientIds.has(u.owner_user_id));
          // Deduplicate by owner_user_id
          const seen = new Set();
          const deduplicated = filtered.filter(u => {
            if (seen.has(u.owner_user_id)) return false;
            seen.add(u.owner_user_id);
            return true;
          });
          setSearchResults(deduplicated);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        if (active) setIsSearching(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, threads]);

  // ─── Start or open chat ───────────────────────────────
  const startChat = useCallback((userOrId) => {
    const user = typeof userOrId === 'string'
      ? searchResults.find(u => u.owner_user_id === userOrId)
      : userOrId;
      
    if (!user) return;
    
    // Check if thread already exists
    const existing = threads.find(t => t.recipientId === user.owner_user_id);
    if (existing) {
      setActiveThread({ ...existing, messages: undefined });
      setMobileView("chat");
      setSearchQuery("");
      setSearchResults([]);
      return;
    }
    
    // Create temporary thread, don't add to threads list yet
    setActiveThread({
      id: `new-${user.owner_user_id}`,
      isNew: true,
      recipientId: user.owner_user_id,
      recipientType: user.profileType || "customer",
      creatorName: user.name || "Unknown User",
      creatorAvatar: user.avatar_url || user.logo_url || "",
      category: user.category || "",
      messages: []
    });
    setMobileView("chat");
    setSearchQuery("");
    setSearchResults([]);
  }, [threads, searchResults]);

  // ─── Thread selection ─────────────────────────────────
  const handleThreadSelect = (thread) => {
    setActiveThread({ ...thread, messages: undefined }); // force reload messages
    setMobileView("chat");
    setShowAnalyzer(false);
    setAnalysis(null);
  };

  // ─── Send message ─────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThread?.id) return;

    const textToSend = inputText;
    setInputText("");

    // Optimistic update
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMsg = {
      id: tempId,
      sender: "me",
      text: textToSend,
      timestamp: new Date().toISOString(),
      pending: true
    };

    setActiveThread(prev => ({
      ...prev,
      messages: [...(prev.messages || []), optimisticMsg],
    }));

    try {
      let targetThreadId = activeThread.id;
      
      // If it's a new temporary thread, create it first
      if (activeThread.isNew) {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipientId: activeThread.recipientId }),
        });
        if (!res.ok) throw new Error("Failed to create thread");
        const data = await res.json();
        targetThreadId = data.threadId;
        
        // Update active thread ID
        setActiveThread(prev => ({
          ...prev,
          id: targetThreadId,
          isNew: false
        }));
      }

      const response = await fetch(`/api/messages/${targetThreadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSend }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Replace optimistic msg with real one
        setActiveThread(prev => {
          if (!prev || prev.id !== targetThreadId) return prev;
          return {
            ...prev,
            messages: (prev.messages || []).map(m => m.id === tempId ? { ...data.message, pending: false } : m),
          };
        });

        // Refresh the whole threads list so the new thread appears at the top
        const refreshRes = await fetch("/api/messages", { cache: "no-store" });
        if (refreshRes.ok) {
          const tData = await refreshRes.json();
          setThreads(tData.threads || []);
        }
      } else {
        alert("Failed to send message.");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending message.");
    }
  };

  // ─── Accept Message Request ───────────────────────────
  const handleAcceptRequest = async () => {
    try {
      const res = await fetch(`/api/messages/${activeThread.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' })
      });
      if (res.ok) {
        setActiveThread(prev => ({ ...prev, status: 'accepted' }));
        setThreads(prev => prev.map(t => t.id === activeThread.id ? { ...t, status: 'accepted' } : t));
        setTimeout(() => {
          document.getElementById('message-input')?.focus();
        }, 50);
      } else {
        alert("Failed to accept request.");
      }
    } catch (err) {
      console.error("Error accepting request:", err);
      alert("Error accepting request.");
    }
  };

  // ─── AI Analyzer ──────────────────────────────────────
  const handleAnalyzeChat = async () => {
    if (!activeThread?.id) return;
    setShowAnalyzer(true);
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const response = await fetch(`/api/messages/${activeThread.id}/analyze`, {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok) {
        setAnalysis(data.result);
      } else {
        alert(data.message || data.error || "Chat analysis failed.");
        setShowAnalyzer(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error running chat analyzer.");
      setShowAnalyzer(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── Contact info helper ──────────────────────────────
  const getContactInfo = (thread) => {
    if (!thread) return { name: "Unknown User", avatar: "", type: "customer", category: "" };
    return {
      name: thread.creatorName || "Unknown User",
      avatar: thread.creatorAvatar || "",
      type: thread.recipientType || "customer",
      category: thread.category || "",
    };
  };

  // ─── Filtered threads by tab ──────────────────────────
  const getFilteredThreads = () => {
    if (activeTab === "messages") {
      return threads.filter(t => t.status === "accepted" || t.isInitiator);
    }
    return threads.filter(t => t.status === "pending" && !t.isInitiator);
  };

  // ─── Matching threads in search ───────────────────────
  const getMatchingThreads = () => {
    if (!searchQuery.trim()) return [];
    return threads.filter(t =>
      getContactInfo(t).name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // ─── Loading state ────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-white border border-brand-border/50 rounded-2xl shadow-sm overflow-hidden h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary mx-auto" />
          <p className="text-sm text-brand-muted font-sans font-semibold">Loading conversations...</p>
        </div>
      </div>
    );
  }

  // ─── Error state ──────────────────────────────────────
  if (loadError) {
    return (
      <div className="bg-white border border-brand-border/50 rounded-2xl shadow-sm overflow-hidden h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-red-600 font-semibold">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-brand-primary hover:underline font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const contactInfo = activeThread ? getContactInfo(activeThread) : null;
  const filteredThreads = getFilteredThreads();
  const matchingThreads = getMatchingThreads();

  return (
    <div className="bg-white border border-brand-border/50 rounded-2xl shadow-sm overflow-hidden h-[calc(100vh-140px)] flex">
      {/* ═════════ SIDEBAR ═════════ */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-brand-border/50 flex flex-col ${mobileView === "chat" ? "hidden md:flex" : "flex"}`}>
        {/* Header */}
        <div className="p-5 border-b border-brand-border/50 bg-[#fdfbfa] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-brand-dark">Inbox</h2>
              <p className="text-xs text-brand-muted mt-1">Your conversations</p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
            <input
              id="inbox-search"
              type="text"
              placeholder="Search chats or find new people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-brand-border/10 border border-brand-border/50 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark placeholder:text-brand-muted outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tabs (only when not searching) */}
          {!searchQuery.trim() && (
            <div className="flex bg-brand-border/20 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("messages")}
                className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${activeTab === "messages" ? "bg-white shadow-sm text-brand-dark" : "text-brand-muted hover:text-brand-dark"}`}
              >
                Messages
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${activeTab === "requests" ? "bg-white shadow-sm text-brand-dark" : "text-brand-muted hover:text-brand-dark"}`}
              >
                Requests
              </button>
            </div>
          )}
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* ── No threads at all ── */}
          {threads.length === 0 && !searchQuery.trim() ? (
            <div className="p-8 text-center space-y-3">
              <MessageCircle className="w-10 h-10 text-brand-border mx-auto" />
              <div>
                <p className="text-sm font-semibold text-brand-dark">No conversations yet</p>
                <p className="text-xs text-brand-muted mt-1">Search for someone to start chatting.</p>
              </div>
            </div>
          ) : !searchQuery.trim() ? (
            /* ── Normal tab view ── */
            filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-brand-muted text-sm">
                No {activeTab} found.
              </div>
            ) : (
              <ul className="divide-y divide-brand-border/40">
                {filteredThreads.map(thread => {
                  const info = getContactInfo(thread);
                  const isSelected = activeThread?.id === thread.id;
                  return (
                    <li key={thread.id}>
                      <button
                        onClick={() => handleThreadSelect(thread)}
                        className={`w-full text-left p-4 flex gap-4 transition-colors ${isSelected ? "bg-brand-primary/5 relative" : "hover:bg-brand-border/10"}`}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary rounded-r" />
                        )}
                        {/* Avatar */}
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-brand-border/40 shrink-0 bg-brand-border/10">
                          {info.avatar ? (
                            <Image src={info.avatar} alt={info.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-brand-muted font-bold text-sm">
                              {info.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <p className={`text-sm truncate pr-2 ${thread.unread ? "font-bold text-brand-dark" : "font-semibold text-brand-dark/80"}`}>
                              {info.name}
                            </p>
                            <span className="text-[10px] text-brand-muted shrink-0">{thread.lastMessageTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              info.type === "creator" ? "bg-purple-50 text-purple-700" : info.type === "brand" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                            }`}>
                              {info.type}
                            </span>
                            <p className={`text-xs truncate ${thread.unread ? "font-medium text-brand-dark" : "text-brand-muted"}`}>
                              {thread.lastMessageText || "Start a conversation"}
                            </p>
                          </div>
                        </div>
                        {thread.unread && (
                          <div className="w-2 h-2 rounded-full bg-brand-primary shrink-0 self-center" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            /* ── Search Mode ── */
            <div>
              {/* Matching existing threads */}
              {matchingThreads.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-brand-border/5 text-[10px] font-bold uppercase tracking-wider text-brand-muted border-b border-brand-border/30">
                    Active Chats
                  </div>
                  <ul className="divide-y divide-brand-border/40">
                    {matchingThreads.map(thread => {
                      const info = getContactInfo(thread);
                      const isSelected = activeThread?.id === thread.id;
                      return (
                        <li key={thread.id}>
                          <button
                            onClick={() => handleThreadSelect(thread)}
                            className={`w-full text-left p-4 flex gap-4 transition-colors ${isSelected ? "bg-brand-primary/5" : "hover:bg-brand-border/10"}`}
                          >
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-brand-border/40 shrink-0 bg-brand-border/10">
                              {info.avatar ? (
                                <Image src={info.avatar} alt={info.name} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-brand-muted font-bold text-sm">
                                  {info.name.charAt(0).toUpperCase()}
                                </div>
                              )}

                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-brand-dark truncate">{info.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  info.type === "creator" ? "bg-purple-50 text-purple-700" : info.type === "brand" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                                }`}>
                                  {info.type}
                                </span>
                                <p className="text-xs text-brand-muted truncate">{thread.lastMessageText || "Start a conversation"}</p>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Discover New People */}
              {searchResults.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-brand-border/5 text-[10px] font-bold uppercase tracking-wider text-brand-muted border-b border-brand-border/30 border-t border-brand-border/30">
                    Find New Contacts
                  </div>
                  <ul className="divide-y divide-brand-border/40">
                    {searchResults.map(user => (
                      <li key={`search-${user.owner_user_id}`}>
                        <button
                          onClick={() => startChat(user.owner_user_id)}
                          className="w-full text-left p-4 flex gap-4 transition-colors hover:bg-brand-border/10"
                        >
                          <div className="relative w-12 h-12 rounded-full overflow-hidden border border-brand-border/40 shrink-0 bg-brand-border/10">
                            {user.avatar_url || user.logo_url ? (
                              <img src={user.avatar_url || user.logo_url} alt={user.name} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-brand-muted uppercase font-bold text-sm">
                                {user.name?.charAt(0)}
                              </div>
                            )}

                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-brand-dark truncate">{user.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                user.profileType === "brand" ? "bg-emerald-50 text-emerald-700" : user.profileType === "creator" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                              }`}>
                                {user.profileType}
                              </span>
                              {user.category && (
                                <p className="text-xs text-brand-muted truncate">{user.category}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Searching spinner */}
              {isSearching && (
                <div className="p-6 text-center text-brand-muted text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Searching...
                </div>
              )}

              {/* No results */}
              {!isSearching && matchingThreads.length === 0 && searchResults.length === 0 && (
                <div className="p-8 text-center text-brand-muted text-sm font-medium">
                  No users found matching &ldquo;{searchQuery}&rdquo;.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═════════ CHAT PANEL ═════════ */}
      {!activeThread ? (
        /* ── No thread selected ── */
        <div className={`flex-1 flex flex-col bg-[#FAF7F0] overflow-y-auto p-8 justify-center items-center ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
          <div className="text-center space-y-4">
            <MessageCircle className="w-14 h-14 text-brand-border mx-auto" />
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#2A2A2A]">Start a Conversation</h3>
              <p className="text-sm text-brand-muted mt-2 max-w-sm mx-auto">
                Search for a creator, brand, or customer using the search bar to begin messaging.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ── Active conversation ── */
        <div className={`flex-1 flex flex-col min-w-0 bg-white relative ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
          {/* Chat Header */}
          <div className="px-5 py-4 border-b border-brand-border/50 flex items-center justify-between bg-white z-10 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileView("list")}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-full text-brand-muted hover:bg-brand-border/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full overflow-hidden border border-brand-border/40 relative bg-brand-border/10">
                {contactInfo.avatar ? (
                  <Image src={contactInfo.avatar} alt={contactInfo.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-muted font-bold">
                    {contactInfo.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-brand-dark">{contactInfo.name}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    contactInfo.type === "creator" ? "bg-purple-50 text-purple-700" : contactInfo.type === "brand" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                  }`}>
                    {contactInfo.type}
                  </span>
                </div>
                {contactInfo.category && (
                  <p className="text-xs text-brand-muted">{contactInfo.category}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyzeChat}
                className="hidden sm:flex text-brand-primary border-brand-primary/30 hover:bg-brand-primary/5"
              >
                <Sparkles className="w-4 h-4 mr-1.5" /> AI Chat Analyzer
              </Button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full text-brand-muted hover:bg-brand-border/20">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-brand-border/5 relative">
            {/* Pending request banner */}
            {activeThread?.status === "pending" && !activeThread.isInitiator && (
              <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4 flex items-center justify-between text-sm text-brand-dark mb-4 shadow-sm">
                <div className="flex flex-col">
                  <span className="font-bold text-brand-primary">Message Request</span>
                  <span className="text-brand-muted text-xs">Accept this request to reply.</span>
                </div>
                <Button onClick={handleAcceptRequest} size="sm" variant="primary">
                  Accept
                </Button>
              </div>
            )}

            {/* AI Analyzer Panel */}
            {showAnalyzer && (
              <div className="bg-white border border-brand-primary/30 shadow-md shadow-brand-primary/10 rounded-2xl p-5 mb-6 animate-in slide-in-from-top-2 fade-in relative">
                <button
                  onClick={() => setShowAnalyzer(false)}
                  className="absolute top-4 right-4 text-brand-muted hover:text-brand-dark"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-brand-primary" />
                  <h4 className="text-sm font-bold text-brand-dark">AI Thread Analysis</h4>
                </div>

                {isAnalyzing ? (
                  <div className="flex items-center gap-3 text-brand-muted text-sm py-2">
                    <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    Analyzing context and intent...
                  </div>
                ) : analysis ? (
                  <div className="space-y-3">
                    <div className="bg-brand-border/20 p-3 rounded-xl border border-brand-border/40">
                      <p className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">Intent</p>
                      <p className="text-sm text-brand-dark">{analysis.intent}</p>
                    </div>
                    <div className="bg-brand-border/20 p-3 rounded-xl border border-brand-border/40">
                      <p className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">Key Details</p>
                      <ul className="list-disc list-inside text-sm text-brand-dark space-y-1">
                        {(analysis.details || []).map((detail, dIdx) => (
                          <li key={dIdx}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                    {analysis.suggestions && (
                      <div className="mt-4 pt-4 border-t border-brand-border/40">
                        <p className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">Suggested Replies</p>
                        <div className="flex flex-col gap-2">
                          {analysis.suggestions.map((suggestion, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => setInputText(suggestion)}
                              className="text-left text-sm text-brand-dark bg-white border border-brand-border/50 p-2.5 rounded-xl hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-colors font-sans"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-brand-muted">No analysis data available.</p>
                )}
              </div>
            )}

            {/* Messages State Rendering */}
            {activeThread.messages === undefined ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 my-auto">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary mx-auto" />
                <p className="text-sm text-brand-muted font-sans font-semibold">Loading conversation...</p>
              </div>
            ) : activeThread.messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 my-auto">
                <h3 className="font-serif text-xl font-bold text-[#2A2A2A]">Start a Conversation</h3>
                <p className="text-sm text-brand-muted max-w-sm">
                  Send the first message to begin chatting with {contactInfo.name}.
                </p>
              </div>
            ) : (
              /* Message bubbles */
              activeThread.messages.map((msg, idx) => {
                const isMe = msg.sender === "me";
                const isPending = msg.pending === true;
                return (
                  <div key={msg.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3 transition-opacity duration-200 ${
                      isPending ? "opacity-60" : ""
                    } ${
                      isMe
                        ? "bg-brand-primary text-white rounded-br-sm"
                        : "bg-white border border-brand-border/50 text-brand-dark shadow-sm rounded-bl-sm"
                    }`}>
                      {msg.image && (
                        <div className="relative w-full h-40 mb-3 rounded-xl overflow-hidden">
                          <Image src={msg.image} alt="Attachment" fill className="object-cover" />
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      <p className={`text-[10px] mt-2 text-right flex items-center justify-end gap-1 ${isMe ? "text-white/70" : "text-brand-muted"}`}>
                        {isPending && <span className="inline-block animate-pulse">⏳</span>}
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 bg-white border-t border-brand-border/50 shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                id="message-input"
                type="text"
                disabled={activeThread?.status === "pending" && !activeThread.isInitiator}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  activeThread?.status === "pending" && !activeThread.isInitiator
                    ? "Accept this request to reply."
                    : "Type your message..."
                }
                className="flex-1 px-4 py-3 bg-brand-border/10 border border-brand-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark placeholder:text-brand-muted disabled:opacity-60 disabled:cursor-not-allowed"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <Button 
                type="submit" 
                variant="primary" 
                disabled={!inputText.trim() || (activeThread?.status === "pending" && !activeThread.isInitiator)} 
                className="px-5"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
