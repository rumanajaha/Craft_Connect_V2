"use client";

import React from "react";
import { Globe } from "lucide-react";
import RoadmapCard from "@/components/common/RoadmapCard";

// Corrected pipeline steps — statuses are stylistic (visual progression), not literal completion
const TIMELINE_ITEMS = [
  {
    label: "STORYTELLING · BRAND",
    title: "Brand Setup",
    description:
      "Brands build a public profile with their story, product showcase, and AI-generated tags that power discovery.",
    status: "done",
  },
  {
    label: "AI MATCHING · CREATOR",
    title: "AI Creator Match",
    description:
      "Our matching engine scores compatibility between a brand's niche and a creator's declared audience.",
    status: "done",
  },
  {
    label: "PITCH · PROPOSAL",
    title: "Pitch & Propose",
    description:
      "Creators pitch a collaboration — gifting, paid, barter, or open to discuss.",
    status: "in-progress",
  },
  {
    label: "TERMS · ACCEPTED",
    title: "Accept & Collaborate",
    description:
      "The brand reviews and accepts the pitch, then works out terms directly in Messages.",
    status: "upcoming",
  },
  {
    label: "DISCOVERY · PUBLISHED",
    title: "Published & Discovered",
    description:
      "The collaboration appears on the brand's profile. Customers connect with the brand directly, off-platform.",
    status: "upcoming",
  },
];

export default function CreatorCollaboration() {
  return (
    <section id="collaboration" className="py-24 px-6 md:px-12 bg-white relative overflow-hidden">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Globe className="w-3.5 h-3.5" />
            <span>THE CREATOR PIPELINE</span>
          </div>
          <h2 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-brand-dark mb-6">
            Ecosystem Collaboration Timeline
          </h2>
          <p className="text-brand-muted text-base md:text-lg leading-relaxed">
            See how independent brands and creators go from first match to a published
            collaboration — powered by AI, closed on their own terms.
          </p>
        </div>

        {/* Horizontal Roadmap Card */}
        <RoadmapCard
          title="Collaboration Pipeline"
          description="From brand setup to published collaboration — five steps, no middleman."
          items={TIMELINE_ITEMS}
        />

      </div>
    </section>
  );
}
