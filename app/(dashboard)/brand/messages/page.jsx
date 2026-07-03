"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { MOCK_MESSAGES, MOCK_BRANDS } from "@/lib/mockData";
import { Send, ArrowLeft, MoreHorizontal, User, UserCheck, Sparkles } from "lucide-react";
import Button from "@/components/ui/button";

function BrandMessagesContent() {
  const searchParams = useSearchParams();
  const threadId = searchParams?.get("thread");
  
  // Filter messages specifically for the active brand (ochre-clay)
  const allThreads = MOCK_MESSAGES.filter(t => t.brandId === "ochre-clay");
  
  const [activeThread, setActiveThread] = useState(null);
  const [mobileView, setMobileView] = useState("list"); // 'list' | 'chat'
  const [inputText, setInputText] = useState("");
  
  // AI Analyzer state
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (threadId) {
      const thread = allThreads.find(t => t.id === threadId);
      if (thread) {
        setActiveThread(thread);
        setMobileView("chat");
      }
    } else if (allThreads.length > 0) {
      setActiveThread(allThreads[0]);
    }
  }, [threadId]);

  const handleThreadSelect = (thread) => {
    setActiveThread(thread);
    setMobileView("chat");
    setShowAnalyzer(false);
  };

  const handleBackToList = () => {
    setMobileView("list");
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    // Create new message object
    const newMessage = {
      id: Date.now().toString(),
      sender: "brand",
      text: inputText,
      timestamp: new Date().toISOString()
    };
    
    // Update active thread locally
    setActiveThread(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
    
    setInputText("");
  };

  const handleAnalyzeChat = () => {
    setShowAnalyzer(true);
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 1500);
  };

  // Helper to get the correct avatar/name for the other party
  const getThreadContactInfo = (thread) => {
    if (thread.isCreatorThread) {
      return {
        name: thread.creatorName,
        avatar: thread.creatorAvatar,
        type: "creator"
      };
    }
    // Customer mock
    return {
      name: "Customer User",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      type: "customer"
    };
  };

  if (!activeThread) return null;

  const contactInfo = getThreadContactInfo(activeThread);

  return (
    <div className="bg-white border border-brand-border/50 rounded-2xl shadow-sm overflow-hidden h-[calc(100vh-140px)] flex">
      
      {/* LEFT PANE: Thread List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-brand-border/50 flex flex-col ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-brand-border/50 bg-[#fdfbfa]">
          <h2 className="font-serif text-xl font-bold text-brand-dark">Inbox</h2>
          <p className="text-xs text-brand-muted mt-1">Customer and Creator messages</p>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {allThreads.length === 0 ? (
            <div className="p-8 text-center text-brand-muted text-sm">No messages found.</div>
          ) : (
            <ul className="divide-y divide-brand-border/40">
              {allThreads.map(thread => {
                const info = getThreadContactInfo(thread);
                const isSelected = activeThread.id === thread.id;
                
                return (
                  <li key={thread.id}>
                    <button
                      onClick={() => handleThreadSelect(thread)}
                      className={`w-full text-left p-4 flex gap-4 transition-colors ${
                        isSelected ? "bg-brand-primary/5 relative" : "hover:bg-brand-border/10"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary rounded-r" />
                      )}
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border border-brand-border/40 shrink-0 bg-white">
                        {info.avatar ? (
                          <Image src={info.avatar} alt={info.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-brand-border/20 text-brand-muted">
                            {info.name.charAt(0)}
                          </div>
                        )}
                        {/* Type Badge on Avatar */}
                        <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border border-white flex items-center justify-center ${
                          info.type === "creator" ? "bg-purple-500" : "bg-emerald-500"
                        }`}>
                          {info.type === "creator" ? (
                            <UserCheck className="w-2.5 h-2.5 text-white" />
                          ) : (
                            <User className="w-2.5 h-2.5 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <p className={`text-sm truncate pr-2 ${thread.unread ? "font-bold text-brand-dark" : "font-semibold text-brand-dark/80"}`}>
                            {info.name}
                          </p>
                          <span className="text-[10px] text-brand-muted shrink-0">{thread.lastMessageTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            info.type === "creator" ? "bg-purple-50 text-purple-700" : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {info.type}
                          </span>
                          <p className={`text-xs truncate ${thread.unread ? "font-medium text-brand-dark" : "text-brand-muted"}`}>
                            {thread.lastMessageText}
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
          )}
        </div>
      </div>

      {/* RIGHT PANE: Chat View */}
      <div className={`flex-1 flex flex-col min-w-0 bg-white relative ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Chat Header */}
        <div className="px-5 py-4 border-b border-brand-border/50 flex items-center justify-between bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBackToList}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-full text-brand-muted hover:bg-brand-border/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden border border-brand-border/40 relative bg-white">
              <Image src={contactInfo.avatar} alt={contactInfo.name} fill className="object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-brand-dark">{contactInfo.name}</h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  contactInfo.type === "creator" ? "bg-purple-50 text-purple-700" : "bg-emerald-50 text-emerald-700"
                }`}>
                  {contactInfo.type}
                </span>
              </div>
              <p className="text-xs text-brand-muted">
                {contactInfo.type === "creator" ? "Creator Pitch Collaboration" : "Customer Inquiry"}
              </p>
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

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-brand-border/5 relative">
          
          {/* AI Analyzer Panel (Overlay/Inline) */}
          {showAnalyzer && (
            <div className="bg-white border border-brand-primary/30 shadow-md shadow-brand-primary/10 rounded-2xl p-5 mb-6 animate-in slide-in-from-top-2 fade-in relative">
              <button 
                onClick={() => setShowAnalyzer(false)}
                className="absolute top-4 right-4 text-brand-muted hover:text-brand-dark"
              >
                <ArrowLeft className="w-4 h-4" /> {/* Or X */}
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
              ) : (
                <div className="space-y-3">
                  {/* TODO: wire to Gemini API */}
                  <div className="bg-brand-border/20 p-3 rounded-xl border border-brand-border/40">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">Intent</p>
                    <p className="text-sm text-brand-dark">
                      {contactInfo.type === "creator" ? "Product seeding / collaboration feature." : "Custom product commission."}
                    </p>
                  </div>
                  <div className="bg-brand-border/20 p-3 rounded-xl border border-brand-border/40">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">Key Details</p>
                    <ul className="list-disc list-inside text-sm text-brand-dark space-y-1">
                      {contactInfo.type === "creator" ? (
                        <>
                          <li>Interest: Minimalist style mugs</li>
                          <li>Channel: Morning routine vlog (YouTube/TikTok)</li>
                          <li>Action required: Agree to terms and request shipping address</li>
                        </>
                      ) : (
                        <>
                          <li>Request: 1.5L tall ceramic water pitcher</li>
                          <li>Modification: Thinner handle</li>
                          <li>Action required: Confirm structural integrity and draft sketch</li>
                        </>
                      )}
                    </ul>
                  </div>
                  
                  {/* Smart Replies */}
                  <div className="mt-4 pt-4 border-t border-brand-border/40">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">Suggested Replies</p>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => setInputText(contactInfo.type === "creator" ? "Hi there! We'd love to collaborate on a morning routine video. What are your typical rates?" : "Hello! We can certainly do that. The structural integrity is fine with a slightly thinner handle. I'll send over a sketch shortly.")}
                        className="text-left text-sm text-brand-dark bg-white border border-brand-border/50 p-2.5 rounded-xl hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-colors"
                      >
                        {contactInfo.type === "creator" ? "Suggest collaboration & ask rates" : "Confirm request & offer sketch"}
                      </button>
                      <button 
                        onClick={() => setInputText(contactInfo.type === "creator" ? "Thanks for reaching out! Could you share your media kit before we proceed?" : "Hi! We'd love to make this custom pitcher for you. Our typical turnaround is 3-4 weeks. Does that timeline work?")}
                        className="text-left text-sm text-brand-dark bg-white border border-brand-border/50 p-2.5 rounded-xl hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-colors"
                      >
                        {contactInfo.type === "creator" ? "Request media kit" : "Confirm request & state timeline"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeThread.messages.map((msg, idx) => {
            // Note: sender "customer" in MOCK_MESSAGES means the other person (customer OR creator)
            // sender "brand" means the brand owner (you)
            const isMe = msg.sender === "brand";
            
            return (
              <div key={msg.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3 ${
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
                  <p className={`text-[10px] mt-2 text-right ${isMe ? "text-white/70" : "text-brand-muted"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-white border-t border-brand-border/50 shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 px-4 py-3 bg-brand-border/10 border border-brand-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark placeholder:text-brand-muted"
            />
            <Button type="submit" variant="primary" disabled={!inputText.trim()} className="px-5">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function BrandMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-brand-muted">Loading messages...</div>}>
      <BrandMessagesContent />
    </Suspense>
  );
}
