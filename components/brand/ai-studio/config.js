import {
  BookOpen,
  FileText,
  Users,
  CalendarDays,
  ScanText,
  Lightbulb,
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
  "campaign-planner": {
    title: "Campaign Planner",
    description: "Generate a week-by-week collaboration strategy for your next product drop.",
    icon: CalendarDays,
    category: "workspace",
    buttonText: "Plan Campaign",
    mockResult: `CAMPAIGN: Holiday Cozy Mug Launch
Duration: 4 weeks · Budget range: $500–$1,000

Week 1 — Seeding
Send PR packages (mug + card) to 8–10 micro-creators in the Slow Living niche. No posting requirements yet.

Week 2 — Teaser Phase
Ask creators to post unboxing Stories / TikToks. No scripted copy — authentic reaction only. Provide hashtag #OchreClayStudio.

Week 3 — Peak Launch
Coordinated Reels and YouTube Shorts go live. Creators use affiliate code (10% off for their audience). Track link clicks.

Week 4 — Follow-Up
Repost the strongest content to brand channels. Send a "thank you" DM to top-performing creators for long-term relationship building.`,
  },
  "request-analyzer": {
    title: "Request Analyzer",
    description: "Paste a raw customer inquiry to extract intent, product specs, budget, and recommended next action.",
    icon: ScanText,
    category: "workspace",
    buttonText: "Analyze Request",
    mockResult: `ANALYSIS COMPLETE

Intent: Custom Commission
Confidence: High

Extracted specs:
• Product type: Ceramic water pitcher
• Capacity: 1.5L (stated)
• Modification: Thinner handle (structural concern — flag this)
• Finish: Natural stoneware (implied)

Budget: Not stated — follow up required
Deadline: Not stated — follow up required

Recommended next action:
Reply to confirm handle dimensions and whether the thinner profile affects structural integrity at 1.5L capacity. Attach a quick sketch or reference photo before quoting a price.`,
  },
  "content-inspiration": {
    title: "Content Inspiration",
    description: "Generate hook ideas and content angles for short-form video (TikTok, Reels, Shorts).",
    icon: Lightbulb,
    category: "workspace",
    buttonText: "Get Ideas",
    mockResult: `TOP 5 CONTENT HOOKS

1. The Process Reveal
"This is what $120 of craft actually looks like." — Time-lapse of throwing → glazing → firing. No voiceover. Just sound.

2. ASMR Unboxing
Soft crinkling of the tissue paper, the thud of the mug on the table. Text on screen: "The most satisfying thing we ship."

3. The Anti-Trendy Take
"Stop buying ceramic mugs from big box stores. Here's why yours matters." — Educational + opinion hook.

4. Pack An Order With Me
First-person POV of wrapping a $150 order. Narrate what's special about each piece. Ends with closing the box.

5. The Mistake
"This kiln batch came out wrong. We're showing you anyway." — Authenticity play. Shows a cracked or bubbled piece. Very high engagement potential.`,
  },
};
