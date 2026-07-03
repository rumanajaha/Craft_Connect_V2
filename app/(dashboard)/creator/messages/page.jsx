"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { MOCK_CREATOR_MESSAGES } from "@/lib/mockData";
import { Send, ArrowLeft, MoreHorizontal, User, Sparkles, MessageSquare } from "lucide-react";
import Button from "@/components/ui/button";

export default function CreatorMessagesPage() {
  const searchParams = useSearchParams();
  const threadId = searchParams?.get("thread");
  
  const allThreads = MOCK_CREATOR_MESSAGES;
  
  const [activeThread, setActiveThread] = useState(null);
  const [mobileView, setMobileView] = useState("list"); // 'list' | 'chat'
  const [inputText, setInputText] = useState("");
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const handleAnalyzeChat = () => {
    setShowAnalyzer(true);
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 1500);
  };
  
  useEffect(() => {
    if (threadId) {
      const thread = allThreads.find(t => t.id === threadId || t.brandId === threadId.replace('thread-', ''));
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
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeThread) return;
    
    const newMessage = {
      id: `ct-m-${Date.now()}`,
      sender: "creator",
      text: inputText,
      timestamp: new Date().toISOString()
    };
    
    activeThread.messages.push(newMessage);
    activeThread.lastMessageText = inputText;
    activeThread.lastMessageTime = "Just now";
    
    setInputText("");
    
    // Simulate brand reply
    setTimeout(() => {
      const reply = {
        id: `ct-m-${Date.now()+1}`,
        sender: "brand",
        text: "Thanks for your message! We'll get back to you shortly.",
        timestamp: new Date().toISOString()
      };
      activeThread.messages.push(reply);
      activeThread.lastMessageText = reply.text;
      
      // trigger re-render
      setActiveThread({ ...activeThread });
    }, 2000);
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] -m-6 md:-m-8 bg-[#FAF7F0] flex">
      {/* ─── Thread List Pane (Left) ─── */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col bg-white border-r border-brand-border/40 shrink-0 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-brand-border/40">
          <h1 className="font-serif text-2xl font-bold text-brand-dark">Messages</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {allThreads.map(thread => {
            const isActive = activeThread?.id === thread.id;
            return (
              <button
                key={thread.id}
                onClick={() => handleThreadSelect(thread)}
                className={`w-full text-left p-4 border-b border-brand-border/30 transition-colors hover:bg-brand-border/10 ${
                  isActive ? "bg-brand-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-brand-border/40 shrink-0">
                    <Image src={thread.brandLogo} alt={thread.brandName} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className={`text-sm truncate ${thread.unread ? "font-bold text-brand-dark" : "font-semibold text-brand-dark/80"}`}>
                        {thread.brandName}
                      </p>
                      <span className={`text-[10px] shrink-0 ml-2 ${thread.unread ? "font-bold text-brand-primary" : "text-brand-muted"}`}>
                        {thread.lastMessageTime}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${thread.unread ? "font-semibold text-brand-dark/90" : "text-brand-muted"}`}>
                      {thread.lastMessageText}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Chat Pane (Right) ─── */}
      <div className={`flex-1 flex flex-col bg-[#fdfbfa] ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {activeThread ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 md:px-6 border-b border-brand-border/40 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setMobileView("list")}
                  className="md:hidden p-2 -ml-2 text-brand-muted hover:text-brand-dark"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-brand-border/40 shrink-0">
                    <Image src={activeThread.brandLogo} alt={activeThread.brandName} fill className="object-cover" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-brand-dark">{activeThread.brandName}</h2>
                    <p className="text-[10px] text-emerald-600 font-medium">Brand Partner</p>
                  </div>
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
                <button className="p-2 text-brand-muted hover:text-brand-dark transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              
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
                      <div className="bg-brand-border/20 p-3 rounded-xl border border-brand-border/40">
                        <p className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">Brand Intent</p>
                        <p className="text-sm text-brand-dark">
                          Looking for a short-form video integration highlighting product aesthetics.
                        </p>
                      </div>
                      <div className="bg-brand-border/20 p-3 rounded-xl border border-brand-border/40">
                        <p className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">Key Details</p>
                        <ul className="list-disc list-inside text-sm text-brand-dark space-y-1">
                          <li>Campaign type: Gifted + Paid potential</li>
                          <li>Deliverables: 1 TikTok or Reel</li>
                          <li>Action required: Confirm rates and shipping details</li>
                        </ul>
                      </div>
                      
                      {/* Smart Replies */}
                      <div className="mt-4 pt-4 border-t border-brand-border/40">
                        <p className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">Suggested Replies</p>
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => setInputText("Hi! I'd love to collaborate. For a dedicated short-form video, my base rate is $300 + gifted product. Let me know if this works for your budget!")}
                            className="text-left text-sm text-brand-dark bg-white border border-brand-border/50 p-2.5 rounded-xl hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-colors"
                          >
                            Accept & state rates ($300 base)
                          </button>
                          <button 
                            onClick={() => setInputText("Thanks for reaching out! I'm currently prioritizing paid partnerships and my schedule is quite full. Let me know if you have budget for this campaign.")}
                            className="text-left text-sm text-brand-dark bg-white border border-brand-border/50 p-2.5 rounded-xl hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-colors"
                          >
                            Politely decline / ask for budget
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeThread.messages.map((msg, idx) => {
                const isMe = msg.sender === "creator";
                const isBrand = msg.sender === "brand";
                
                return (
                  <div key={msg.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className="flex items-end gap-2 max-w-[85%] md:max-w-[70%]">
                      {!isMe && (
                        <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-brand-border/40 mb-1">
                          <Image src={activeThread.brandLogo} alt="Brand" fill className="object-cover" />
                        </div>
                      )}
                      
                      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div 
                          className={`px-4 py-2.5 rounded-2xl text-sm ${
                            isMe 
                              ? "bg-brand-primary text-white rounded-br-sm shadow-sm shadow-brand-primary/20" 
                              : "bg-white border border-brand-border/50 text-brand-dark rounded-bl-sm shadow-sm"
                          }`}
                        >
                          {msg.text}
                          {msg.image && (
                            <div className="mt-2 relative w-48 h-48 rounded-lg overflow-hidden border border-black/10">
                              <Image src={msg.image} alt="Attachment" fill className="object-cover" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-brand-muted mt-1 px-1">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-brand-border/40 shrink-0">
              <form onSubmit={handleSend} className="flex items-end gap-3 max-w-4xl mx-auto">
                <div className="flex-1 relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Write a message..."
                    rows={1}
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-brand-border bg-brand-border/10 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark resize-none min-h-[46px] max-h-32"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 bottom-2.5 text-brand-muted hover:text-brand-dark p-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                </div>
                <Button 
                  type="submit"
                  variant="primary" 
                  size="icon"
                  className="w-11 h-11 shrink-0 rounded-xl"
                  disabled={!inputText.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-brand-muted">
            <MessageSquare className="w-12 h-12 mb-4 text-brand-border" />
            <h3 className="font-serif text-xl font-bold text-brand-dark mb-2">No thread selected</h3>
            <p className="text-sm max-w-sm">
              Choose a conversation from the list to start messaging with brands.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
