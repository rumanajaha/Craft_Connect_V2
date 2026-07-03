"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Send, Paperclip, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { MOCK_BRANDS, MOCK_MESSAGES } from "@/lib/mockData";
import Button from "@/components/ui/button";

// Local in-memory message state (structured for easy Supabase Realtime wiring later)
function useMessages(initialThreads) {
  const [threads, setThreads] = useState(initialThreads);
  const addMessage = (threadId, msg) => {
    setThreads(prev => prev.map(t =>
      t.id === threadId
        ? { ...t, messages: [...t.messages, msg], lastMessageText: msg.text ?? "📎 Image", lastMessageTime: "Just now", unread: false }
        : t
    ));
  };
  return { threads, addMessage };
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const initialThreadId = searchParams.get("thread") ?? MOCK_MESSAGES[0]?.id;

  const { threads, addMessage } = useMessages(
    MOCK_MESSAGES.map(t => ({ ...t, messages: [...t.messages] }))
  );

  const [activeId, setActiveId]   = useState(initialThreadId);
  const [mobileView, setMobileView] = useState("list"); // "list" | "thread"
  const [text, setText]           = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);

  const activeThread = threads.find(t => t.id === activeId);
  const activeBrand  = MOCK_BRANDS.find(b => b.id === activeThread?.brandId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !imagePreview) return;
    addMessage(activeId, {
      id: `msg-${Date.now()}`,
      sender: "customer",
      text: trimmed,
      image: imagePreview ?? undefined,
      timestamp: new Date().toISOString()
    });
    setText("");
    setImagePreview(null);
  };

  const handleKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const openThread = (id) => {
    setActiveId(id);
    setMobileView("thread");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-serif text-3xl font-bold text-brand-dark mb-5">Messages</h1>
      <div className="bg-white rounded-2xl border border-brand-border/50 shadow-sm overflow-hidden flex h-[calc(100vh-13rem)]">

        {/* Thread list pane */}
        <div className={`w-full md:w-72 lg:w-80 border-r border-brand-border/40 flex flex-col shrink-0 ${mobileView === "thread" ? "hidden md:flex" : "flex"}`}>
          <div className="px-4 py-3 border-b border-brand-border/40">
            <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">Conversations</p>
          </div>
          <ul className="flex-1 overflow-y-auto divide-y divide-brand-border/30">
            {threads.map(thread => {
              const brand = MOCK_BRANDS.find(b => b.id === thread.brandId);
              const isActive = thread.id === activeId;
              return (
                <li key={thread.id}>
                  <button
                    onClick={() => openThread(thread.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors ${isActive ? "bg-brand-primary/5 border-l-2 border-brand-primary" : "hover:bg-brand-border/10"}`}
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-brand-border/20">
                      <Image src={brand?.logo ?? ""} alt={brand?.name ?? ""} fill sizes="40px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-semibold text-brand-dark truncate">{brand?.name}</span>
                        <span className="text-[10px] text-brand-muted shrink-0">{thread.lastMessageTime}</span>
                      </div>
                      <p className="text-xs text-brand-muted mt-0.5 truncate">{thread.lastMessageText}</p>
                    </div>
                    {thread.unread && <div className="w-2 h-2 rounded-full bg-brand-primary mt-1.5 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Active thread pane */}
        <div className={`flex-1 flex flex-col min-w-0 ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
          {activeThread ? (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-brand-border/40">
                <button onClick={() => setMobileView("list")} className="md:hidden text-brand-muted hover:text-brand-dark">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-brand-border/20 shrink-0">
                  <Image src={activeBrand?.logo ?? ""} alt={activeBrand?.name ?? ""} fill sizes="36px" className="object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-brand-dark">{activeBrand?.name}</p>
                  <p className="text-[10px] text-brand-muted">{activeBrand?.category}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {activeThread.messages.map(msg => {
                  const isCustomer = msg.sender === "customer";
                  return (
                    <div key={msg.id} className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs lg:max-w-sm rounded-2xl px-4 py-2.5 text-sm ${
                        isCustomer
                          ? "bg-brand-primary text-white rounded-br-sm"
                          : "bg-brand-border/30 text-brand-dark rounded-bl-sm"
                      }`}>
                        {msg.image && (
                          <div className="relative w-48 h-32 mb-2 rounded-xl overflow-hidden">
                            <Image src={msg.image} alt="attachment" fill sizes="200px" className="object-cover" />
                          </div>
                        )}
                        {msg.text && <p className="leading-relaxed">{msg.text}</p>}
                        <p className={`text-[10px] mt-1 ${isCustomer ? "text-white/60" : "text-brand-muted"}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {/* Image preview bubble */}
                {imagePreview && (
                  <div className="flex justify-end">
                    <div className="relative w-32 h-24 rounded-xl overflow-hidden border-2 border-brand-primary/30">
                      <Image src={imagePreview} alt="preview" fill sizes="130px" className="object-cover" />
                      <button onClick={() => setImagePreview(null)} className="absolute top-1 right-1 bg-white/90 rounded-full w-5 h-5 flex items-center justify-center text-brand-muted text-xs hover:text-red-500">✕</button>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t border-brand-border/40 px-4 py-3 flex items-end gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-brand-muted hover:text-brand-primary hover:bg-brand-primary/10 transition-colors shrink-0"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… (Enter to send)"
                  rows={1}
                  className="flex-1 resize-none px-4 py-2.5 rounded-2xl bg-brand-border/20 border border-transparent focus:border-brand-primary/30 focus:ring-2 focus:ring-brand-primary/10 text-sm text-brand-dark placeholder-brand-muted/60 outline-none transition-all max-h-32"
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() && !imagePreview}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-brand-primary text-white hover:bg-brand-secondary transition-colors disabled:opacity-40 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-brand-muted">
              <ImageIcon className="w-10 h-10 text-brand-border" />
              <p className="text-sm">Select a conversation to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="text-brand-muted text-sm p-8">Loading messages…</div>}>
      <MessagesContent />
    </Suspense>
  );
}
