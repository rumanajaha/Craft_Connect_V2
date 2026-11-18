import {
  BookOpen,
  FileText,
  Users,
} from "lucide-react";

export const TOOL_CONFIG = {
  "brand-story": {
    title: "Brand Story Generator",
    description: "Craft a compelling narrative for your brand's public about / philosophy section.",
    icon: BookOpen,
    category: "publish",
    buttonText: "Generate Story",
    mockResult: `Rooted in the slow rhythms of Kyoto's ceramic district and the rugged forests of the Pacific Northwest, Ochre Clay Studio exists at the intersection of ancient technique and quiet modernity.

Every piece we make — from a whisper-thin tea bowl to a full dinner service — carries the imprint of hands, time, and fire. We don't chase trends. We chase that specific gravity that makes you pick up a mug and hold it just a little longer than you planned.

Our wood kilns take three weeks to cool. Our glazes are mixed from locally sourced iron oxide and ash. The imperfections are the point.`,
  },
  "seo-description": {
    title: "SEO Description Writer",
    description: "Generate high-converting, keyword-rich product copy that saves directly to your selected product.",
    icon: FileText,
    category: "publish",
    buttonText: "Generate Description",
    mockResult: `Discover timeless craftsmanship with our handmade ceramic collection. Each piece is individually thrown on the wheel, glazed with raw stoneware minerals, and fired in a wood-fuelled kiln — creating organic variations you won't find anywhere else.

Perfect for the mindful home. Built to outlast the season.

• Hand-thrown stoneware — no two pieces alike
• Food-safe, dishwasher-safe glaze
• Ships in recycled craft packaging`,
  },
  "creator-match": {
    title: "Creator Match AI",
    description: "Find the perfect micro-influencer profiles for your next product launch.",
    icon: Users,
    category: "workspace",
    buttonText: "Find Matches",
    mockResult: `Based on your inputs, here are your top creator archetypes:

#1 — The Slow Living Vlogger (30k–80k followers)
Channels: YouTube, TikTok · Engagement: 4–6%
Best fit: morning routine, unboxing, "things I love" formats.

#2 — The ASMR Potter (10k–25k followers)
Channels: Instagram Reels, TikTok
Best fit: process videos, clay + ceramics adjacent audiences.

#3 — The Aesthetic Interior Blogger (50k–120k followers)
Channels: Instagram, Pinterest
Best fit: shelfie posts, flat-lay product features.

Recommendation: Start with archetype #1 for fastest conversion. Offer gifting + a 10% affiliate code.`,
  },
};
