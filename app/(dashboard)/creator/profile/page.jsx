"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Users, Activity, Eye, Handshake, X, Send } from "lucide-react";
import PortfolioDetailModal from "@/components/common/PortfolioDetailModal";
import Button from "@/components/ui/button";

const COMP_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "gifting", label: "Gifting" },
  { value: "barter", label: "Barter" },
  { value: "discuss", label: "Discuss" },
];

function CreatorProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const creatorIdParam = searchParams?.get("id");

  const [creator, setCreator] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [viewerRole, setViewerRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [showProposalModal, setShowProposalModal] = useState(false);
  const [compensationType, setCompensationType] = useState("paid");
  const [proposalMessage, setProposalMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [proposalError, setProposalError] = useState("");

  useEffect(() => {
    async function fetchProfileData() {
      try {
        setLoading(true);
        setError(null);

        const meRes = await fetch("/api/auth/me").catch(() => null);
        if (meRes && meRes.ok) {
          const meData = await meRes.json();
          setViewerRole(meData?.user?.role || null);
        }

        if (creatorIdParam) {
          const res = await fetch(`/api/creator/public/${encodeURIComponent(creatorIdParam)}`);
          if (!res.ok) throw new Error("Failed to load creator profile");
          const data = await res.json();
          setCreator(data.profile);
          setPortfolio(data.portfolio || []);
        } else {
          const [profileRes, portfolioRes] = await Promise.all([
            fetch("/api/creator/profile"),
            fetch("/api/creator/portfolio"),
          ]);
          if (!profileRes.ok) throw new Error("Failed to load creator profile");
          if (!portfolioRes.ok) throw new Error("Failed to load creator portfolio");
          const profileData = await profileRes.json();
          const portfolioData = await portfolioRes.json();
          setCreator(profileData.profile);
          setPortfolio(portfolioData.portfolio || []);
        }
      } catch (err) {
        console.error("Error fetching creator profile:", err);
        setError(err.message || "Failed to load profile details.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfileData();
  }, [creatorIdParam]);

  const handleProposeCollaboration = async (e) => {
    e.preventDefault();
    if (!proposalMessage.trim() || !creator?.id) return;
    setSubmitting(true);
    setProposalError("");

    try {
      const res = await fetch("/api/brand/pitches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: creator.id,
          compensationType,
          message: proposalMessage.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send collaboration proposal.");
      }

      setShowProposalModal(false);
      setProposalMessage("");
      router.push(
        data.threadId ? `/brand/messages?thread=${data.threadId}` : "/brand/messages"
      );
    } catch (err) {
      setProposalError(err.message || "Failed to send proposal.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        <p className="text-brand-muted text-sm mt-3 font-semibold">Loading profile...</p>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
        <h3 className="font-serif font-bold text-red-800 text-lg mb-2">Error Loading Profile</h3>
        <p className="text-sm text-red-600 mb-4">{error || "Could not retrieve creator profile."}</p>
        <Link href="/creator/settings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary bg-brand-primary/10 px-4 py-2 rounded-xl hover:bg-brand-primary/20 transition-colors">
          Go to Settings
        </Link>
      </div>
    );
  }

  const creatorName = creator.display_name || creator.displayName || "Anonymous Creator";
  const creatorAvatar = creator.avatar_url || creator.avatar || null;
  const creatorInitial = (creatorName.trim()[0] || "C").toUpperCase();
  const nichesList = typeof creator.niches === "string"
    ? creator.niches.split(",").map(n => n.trim()).filter(Boolean)
    : (creator.niches || []);
  const tagsList = creator.tags
    ? creator.tags.split(",").map(t => t.trim()).filter(Boolean)
    : [];
  const isBrandViewer = viewerRole === "BRANDOWNER";

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="relative w-full h-52 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-primary/20 to-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute bottom-4 left-5 flex items-end gap-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-white flex items-center justify-center">
            {creatorAvatar ? (
              <Image src={creatorAvatar} alt={creatorName} fill sizes="80px" className="object-cover" unoptimized />
            ) : (
              <span className="font-serif text-3xl font-bold text-brand-primary">
                {creatorInitial}
              </span>
            )}
          </div>
          <div className="pb-1">
            <h1 className="font-serif text-2xl font-bold text-white leading-tight drop-shadow-sm">{creatorName}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-white/90">
              <span className="text-sm font-medium">{creator.location || ""}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-brand-border/50 rounded-full shadow-sm">
            <Users className="w-4 h-4 text-brand-primary" />
            <span className="text-sm font-bold text-brand-dark">{(creator.followers || creator.follower_count || 0).toLocaleString()}</span>
            <span className="text-xs text-brand-muted">Followers</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full shadow-sm">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700">{creator.engagementRate || creator.engagement_rate || 0}% Engagement</span>
          </div>

          <div className="flex items-center gap-2">
            {(creator.instagram || creator.instagram_url) && (
              <a href={`https://instagram.com/${creator.instagram || creator.instagram_url}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white border border-brand-border/50 flex items-center justify-center text-brand-muted hover:text-brand-primary hover:border-brand-primary/50 transition-colors shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
            )}
            {(creator.tiktok || creator.tiktok_url) && (
              <a href={`https://tiktok.com/@${creator.tiktok || creator.tiktok_url}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white border border-brand-border/50 flex items-center justify-center text-brand-muted hover:text-black hover:border-black/50 transition-colors shadow-sm">
                <svg className="w-4 h-4 fill-current stroke-none" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.28 0 .54.04.8.1V9.01a6.27 6.27 0 0 0-.8-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.8a8.18 8.18 0 0 0 4.77 1.53V6.87a4.83 4.83 0 0 1-1.01-.18Z"/></svg>
              </a>
            )}
            {(creator.youtube || creator.youtube_url) && (
              <a href={`https://youtube.com/@${creator.youtube || creator.youtube_url}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white border border-brand-border/50 flex items-center justify-center text-brand-muted hover:text-red-500 hover:border-red-500/50 transition-colors shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
              </a>
            )}
          </div>
        </div>

        <div>
          {isBrandViewer ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setProposalError("");
                setShowProposalModal(true);
              }}
              className="inline-flex items-center gap-2"
            >
              <Handshake className="w-4 h-4" />
              Propose Collaboration
            </Button>
          ) : !creatorIdParam ? (
            <Link href="/creator/settings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary bg-brand-primary/10 px-4 py-2 rounded-xl hover:bg-brand-primary/20 transition-colors">
              Edit Profile
            </Link>
          ) : null}
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-brand-border/50 p-6 shadow-sm">
        <h2 className="font-serif text-lg font-bold text-brand-dark mb-3">About {creatorName.split(" ")[0]}</h2>
        <p className="text-sm text-brand-dark/90 leading-relaxed whitespace-pre-wrap max-w-3xl">
          {creator.bio || ""}
        </p>

        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-brand-border/40">
          {nichesList.map(niche => (
            <span key={niche} className="text-xs font-bold uppercase tracking-wider text-brand-dark bg-brand-border/20 px-2.5 py-1 rounded-full">
              {niche}
            </span>
          ))}
          {tagsList.map(tag => (
            <span key={tag} className="text-xs font-semibold text-brand-muted bg-brand-border/10 px-2.5 py-1 rounded-full border border-brand-border/30">
              #{tag}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-brand-dark">Portfolio &amp; Recent Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {portfolio.map(item => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedItem({
                  ...item,
                  creatorName,
                  creatorAvatar,
                  portfolioImage: item.media_url,
                  caption: item.description,
                  ai_tags: nichesList,
                });
                setIsDetailOpen(true);
              }}
              className="group bg-white rounded-2xl border border-brand-border/50 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div className="relative aspect-[4/3] w-full bg-brand-border/20 overflow-hidden">
                {item.media_url && (
                  <Image
                    src={item.media_url}
                    alt={item.title || "Portfolio item"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-serif font-bold text-brand-dark text-base truncate">{item.title}</h3>
                {item.description && (
                  <p className="text-xs text-brand-muted mt-1 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-end mt-3 text-[11px] text-brand-muted gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {(item.view_count || 0).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PortfolioDetailModal
        item={selectedItem}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      {showProposalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <form
            onSubmit={handleProposeCollaboration}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 relative border border-brand-border/40"
          >
            <button
              type="button"
              onClick={() => !submitting && setShowProposalModal(false)}
              className="absolute top-4 right-4 text-brand-muted hover:text-brand-dark"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-xl font-bold text-brand-dark">Propose Collaboration</h2>
              <p className="text-xs text-brand-muted mt-1">to {creatorName}</p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/80 block mb-2">
                Compensation Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {COMP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCompensationType(opt.value)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      compensationType === opt.value
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-white text-brand-muted border-brand-border/60 hover:border-brand-primary/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/80 block mb-1.5">
                Proposal Message <span className="text-brand-primary">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={proposalMessage}
                onChange={(e) => setProposalMessage(e.target.value)}
                placeholder="Share campaign deliverables, timeline, and why you'd love to collaborate…"
                className="w-full px-4 py-3 rounded-2xl bg-white border border-brand-border/80 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 text-sm text-brand-dark outline-none resize-none"
              />
            </div>

            {proposalError && (
              <p className="text-xs text-red-600 font-medium">{proposalError}</p>
            )}

            <Button type="submit" variant="primary" size="md" className="w-full" disabled={submitting || !proposalMessage.trim()}>
              <Send className="w-4 h-4 mr-1.5" />
              {submitting ? "Sending Proposal…" : "Send Proposal"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function CreatorPublicProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </div>
      }
    >
      <CreatorProfileContent />
    </Suspense>
  );
}
