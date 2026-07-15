"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Send, ArrowLeft, MoreHorizontal, User, UserCheck, Sparkles, Loader2 } from "lucide-react";
import Button from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabaseClient";

function BrandMessagesContent() {
  const searchParams = useSearchParams();
  const threadId = searchParams?.get("thread");
  
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [mobileView, setMobileView] = useState("list"); 
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const [creators, setCreators] = useState([]);

  useEffect(() => {
    async function loadCreators() {
      try {
        const response = await fetch("/api/brand/dashboard");
        if (response.ok) {
          const data = await response.json();
          setCreators(data.creatorMatches || []);
        }
      } catch (err) {
        console.error("Error loading creators for messages:", err);
      }
    }
    loadCreators();
  }, []);

  const startChat = async (recipientId) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/brand/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId })
      });
      if (res.ok) {
        const data = await res.json();
        const response = await fetch("/api/brand/messages");
        if (response.ok) {
          const tData = await response.json();
          setThreads(tData.threads || []);
          const found = (tData.threads || []).find(t => t.id === data.threadId);
          if (found) {
            setActiveThread(found);
            setMobileView("chat");
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Fetch all threads on mount
  useEffect(() => {
    async function loadThreads() {
      try {
        const response = await fetch("/api/brand/messages");
        if (response.ok) {
          const data = await response.json();
          setThreads(data.threads || []);
          
          // Select default or query thread
          if (threadId) {
            const thread = (data.threads || []).find(t => t.id === threadId);
            if (thread) {
              setActiveThread(thread);
              setMobileView("chat");
            }
          } else if ((data.threads || []).length > 0) {
            setActiveThread(data.threads[0]);
          }
        }
      } catch (err) {
        console.error("Error loading messages:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadThreads();
  }, [threadId]);

  // 2. Fetch active thread messages history when activeThread changes
  useEffect(() => {
    if (!activeThread?.id) return;
    
    // Check if messages are already fetched (or fetch fresh history)
    async function loadMessages() {
      try {
        const res = await fetch(`/api/brand/messages/${activeThread.id}`);
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
    
    if (!activeThread.messages) {
      loadMessages();
    }
  }, [activeThread?.id]);

  // 3. Supabase Realtime message subscription
  useEffect(() => {
    if (!activeThread?.id) return;

    const channel = supabaseBrowser
      .channel(`chat-${activeThread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `thread_id=eq.${activeThread.id}`
        },
        async (payload) => {
          const newMsg = payload.new;

          // Check if sender is current user
          const { data: { session } } = await supabaseBrowser.auth.getSession();
          const currentUserId = session?.user?.id;
          if (newMsg.sender_id === currentUserId) return;

          const formatted = {
            id: newMsg.id,
            sender: activeThread.isCreatorThread ? "creator" : "customer",
            text: newMsg.body,
            image: newMsg.attachment_url,
            timestamp: newMsg.created_at
          };

          setActiveThread(prev => {
            if (prev && prev.id === newMsg.thread_id) {
              if (prev.messages?.some(m => m.id === newMsg.id)) return prev;
              return {
                ...prev,
                messages: [...(prev.messages || []), formatted]
              };
            }
            return prev;
          });

          // Update last message in thread list
          setThreads(prevThreads =>
            prevThreads.map(t => {
              if (t.id === newMsg.thread_id) {
                return {
                  ...t,
                  lastMessageText: newMsg.body,
                  lastMessageTime: "Just now",
                  unread: true
                };
              }
              return t;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [activeThread?.id, activeThread?.isCreatorThread]);

  const handleThreadSelect = (thread) => {
    setActiveThread(thread);
    setMobileView("chat");
    setShowAnalyzer(false);
    setAnalysis(null);
  };

  const handleBackToList = () => {
    setMobileView("list");
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThread?.id) return;
    
    const textToSend = inputText;
    setInputText("");

    // optimistic update locally
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender: "brand",
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setActiveThread(prev => ({
      ...prev,
      messages: [...(prev.messages || []), optimisticMsg]
    }));

    try {
      const response = await fetch(`/api/brand/messages/${activeThread.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSend })
      });
      if (response.ok) {
        const data = await response.json();
        // Replace optimistic msg with real one
        setActiveThread(prev => ({
          ...prev,
          messages: (prev.messages || []).map(m => m.id === tempId ? data.message : m)
        }));

        // Update last message preview in list
        setThreads(prevThreads =>
          prevThreads.map(t => {
            if (t.id === activeThread.id) {
              return {
                ...t,
                lastMessageText: textToSend,
                lastMessageTime: "Just now",
                unread: false
              };
            }
            return t;
          })
        );
      } else {
        alert("Failed to send message.");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending message.");
    }
  };

  const handleAnalyzeChat = async () => {
    if (!activeThread?.id) return;
    setShowAnalyzer(true);
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const response = await fetch(`/api/brand/messages/${activeThread.id}/analyze`, {
        method: "POST"
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

  
  const getThreadContactInfo = (thread) => {
    if (thread.isCreatorThread) {
      return {
        name: thread.creatorName,
        avatar: thread.creatorAvatar,
        type: "creator"
      };
    }
    
    return {
      name: "Customer User",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      type: "customer"
    };
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-brand-border/50 rounded-2xl shadow-sm overflow-hidden h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary mx-auto" />
          <p className="text-sm text-brand-muted font-sans font-semibold">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  const contactInfo = activeThread ? getThreadContactInfo(activeThread) : null;

  return (
    <div className="bg-white border border-brand-border/50 rounded-2xl shadow-sm overflow-hidden h-[calc(100vh-140px)] flex">
      
      
      <div className={`w-full md:w-80 lg:w-96 border-r border-brand-border/50 flex flex-col ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-brand-border/50 bg-[#fdfbfa]">
          <h2 className="font-serif text-xl font-bold text-brand-dark">Inbox</h2>
          <p className="text-xs text-brand-muted mt-1">Customer and Creator messages</p>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {threads.length === 0 ? (
            <div className="p-8 text-center text-brand-muted text-sm">No messages found.</div>
          ) : (
            <ul className="divide-y divide-brand-border/40">
              {threads.map(thread => {
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

      
      {!activeThread ? (
        <div className={`flex-1 flex flex-col bg-[#FAF7F0] overflow-y-auto p-8 justify-center items-center ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
          <div className="max-w-xl text-center space-y-6">
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#2A2A2A]">Start a Conversation</h3>
              <p className="text-sm text-brand-muted mt-2">
                Select one of your matched creators below to begin messaging and collaborate.
              </p>
            </div>
            
            {creators.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-brand-border/40 text-brand-muted text-sm font-semibold">
                No matching creators found. Go to Dashboard to discover matches!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {creators.map(creator => (
                  <div key={creator.id} className="p-4 bg-white rounded-2xl border border-brand-border/40 flex flex-col justify-between hover:border-brand-primary/30 transition-all shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-brand-border/40 shrink-0 bg-brand-border/20">
                        {creator.avatar ? (
                          <img src={creator.avatar} alt={creator.name} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand-muted font-bold text-xs uppercase bg-brand-border/20">
                            {creator.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#2A2A2A] truncate">{creator.name}</p>
                        <p className="text-xs text-brand-muted font-medium">{creator.followers} followers</p>
                      </div>
                    </div>
                    <button
                      onClick={() => startChat(creator.owner_user_id)}
                      className="mt-4 w-full bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      Chat Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={`flex-1 flex flex-col min-w-0 bg-white relative ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        
        
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

        
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-brand-border/5 relative">
          
          
          {showAnalyzer && (
            <div className="bg-white border border-brand-primary/30 shadow-md shadow-brand-primary/10 rounded-2xl p-5 mb-6 animate-in slide-in-from-top-2 fade-in relative">
              <button 
                onClick={() => setShowAnalyzer(false)}
                className="absolute top-4 right-4 text-brand-muted hover:text-brand-dark"
              >
                <ArrowLeft className="w-4 h-4" /> 
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
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">Intent</p>
                    <p className="text-sm text-brand-dark">
                      {analysis?.intent || (contactInfo.type === "creator" ? "Product seeding / collaboration feature." : "Custom product commission.")}
                    </p>
                  </div>
                  <div className="bg-brand-border/20 p-3 rounded-xl border border-brand-border/40">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">Key Details</p>
                    <ul className="list-disc list-inside text-sm text-brand-dark space-y-1">
                      {analysis?.details ? (
                        analysis.details.map((detail, dIdx) => (
                          <li key={dIdx}>{detail}</li>
                        ))
                      ) : contactInfo.type === "creator" ? (
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
                  
                  
                  <div className="mt-4 pt-4 border-t border-brand-border/40">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">Suggested Replies</p>
                    <div className="flex flex-col gap-2">
                      {analysis?.suggestions ? (
                        analysis.suggestions.map((suggestion, sIdx) => (
                          <button 
                            key={sIdx}
                            onClick={() => setInputText(suggestion)}
                            className="text-left text-sm text-brand-dark bg-white border border-brand-border/50 p-2.5 rounded-xl hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-colors font-sans"
                          >
                            {suggestion}
                          </button>
                        ))
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeThread.messages.map((msg, idx) => {
            
            
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
      )}
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
