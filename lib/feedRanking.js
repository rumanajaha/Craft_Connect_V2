/**
 * Client-Side Feed Ranking Logic Approximation
 * 
 * TODO: replace with real FeedCache query once backend is live.
 * This is a client-side approximation of the real formula, and the real 
 * implementation will run server-side against the FeedCache table (per Section 5.5 V1)
 * once the backend is wired up.
 */

// Initial hardcoded mock items to populate the feed
const MOCK_INITIAL_FEED_ITEMS = [
  {
    id: "feed-p1",
    type: "product",
    productId: "p1",
    name: "Organic Speckled Clay Vase",
    price: 120,
    image: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=500&auto=format&fit=crop&q=80",
    brandId: "ochre-clay",
    brandName: "Ochre Clay Studio",
    brandLogo: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=120&auto=format&fit=crop&q=80",
    created_at: "2026-07-02T10:00:00Z",
    views: 1200,
    saves: 140,
    rating: 4.9,
    ai_tags: ["ceramics", "handmade", "minimalist", "wabi-sabi", "tableware"]
  },
  {
    id: "feed-p4",
    type: "product",
    productId: "p4",
    name: "Belgian Flax Handloomed Throw",
    price: 145,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80",
    brandId: "gaea-weaves",
    brandName: "Gaea Weaves",
    brandLogo: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=120&auto=format&fit=crop&q=80",
    created_at: "2026-06-30T15:00:00Z",
    views: 800,
    saves: 85,
    rating: 4.7,
    ai_tags: ["textiles", "eco-friendly", "handmade", "linen", "sustainable"]
  },
  {
    id: "feed-c1",
    type: "creator_content",
    creatorId: "creator-1",
    creatorName: "Sarah Indigo",
    creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    portfolioImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80",
    caption: "Just launched a new series showing the wabi-sabi aesthetics of hand-thrown ceramics.",
    created_at: "2026-07-01T12:00:00Z",
    views: 3500,
    saves: 420,
    rating: 4.8,
    ai_tags: ["ceramics", "wabi-sabi", "lifestyle", "handmade", "aesthetic"]
  },
  {
    id: "feed-p6",
    type: "product",
    productId: "p6",
    name: "Hand-Planed Walnut Cutting Board",
    price: 95,
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80",
    brandId: "soren-objects",
    brandName: "Soren Objects",
    brandLogo: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=120&auto=format&fit=crop&q=80",
    created_at: "2026-06-28T09:00:00Z",
    views: 1800,
    saves: 210,
    rating: 4.8,
    ai_tags: ["woodwork", "design", "kitchen", "handmade", "minimalist"]
  },
  {
    id: "feed-c2",
    type: "creator_content",
    creatorId: "creator-2",
    creatorName: "Liam Woodcraft",
    creatorAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
    portfolioImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&auto=format&fit=crop&q=80",
    caption: "Sanded walnut table close-up. Exploring natural wood textures and sustainable design.",
    created_at: "2026-07-02T18:30:00Z",
    views: 2200,
    saves: 280,
    rating: 4.9,
    ai_tags: ["woodwork", "design", "sustainable", "handmade", "interior"]
  },
  {
    id: "feed-bu1",
    type: "brand_update",
    brandId: "soren-objects",
    brandName: "Soren Objects",
    brandLogo: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=120&auto=format&fit=crop&q=80",
    bannerImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
    updateType: "story",
    updateText: "Soren Objects published a new brand story focusing on solid walnut creations.",
    created_at: "2026-07-01T08:00:00Z",
    views: 950,
    saves: 110,
    rating: 4.8,
    ai_tags: ["woodwork", "sustainable", "handmade", "minimalist"]
  },
  {
    id: "feed-p8",
    type: "product",
    productId: "p8",
    name: "Cedar & Lavender Forest Candle",
    price: 36,
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&auto=format&fit=crop&q=80",
    brandId: "aether-scents",
    brandName: "Aether Scents",
    brandLogo: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=120&auto=format&fit=crop&q=80",
    created_at: "2026-06-29T14:00:00Z",
    views: 1100,
    saves: 98,
    rating: 4.6,
    ai_tags: ["apothecary", "handmade", "natural", "wellness", "eco-friendly"]
  },
  {
    id: "feed-c3",
    type: "creator_content",
    creatorId: "creator-3",
    creatorName: "Elena Rostova",
    creatorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    portfolioImage: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&auto=format&fit=crop&q=80",
    caption: "Favourite morning ritual — matcha in handcrafted ceramics. Slow, intentional, beautiful.",
    created_at: "2026-07-03T07:00:00Z",
    views: 5100,
    saves: 640,
    rating: 4.9,
    ai_tags: ["lifestyle", "aesthetic", "ceramics", "slow living", "handmade"]
  },
  {
    id: "feed-p10",
    type: "product",
    productId: "p10",
    name: "Organic Cold-Pressed Jojoba Elixir",
    price: 52,
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&auto=format&fit=crop&q=80",
    brandId: "sienna-botanicals",
    brandName: "Sienna Botanicals",
    brandLogo: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=120&auto=format&fit=crop&q=80",
    created_at: "2026-07-02T16:00:00Z",
    views: 1650,
    saves: 195,
    rating: 4.9,
    ai_tags: ["apothecary", "natural", "skincare", "organic", "wellness"]
  },
  {
    id: "feed-bu2",
    type: "brand_update",
    brandId: "aether-scents",
    brandName: "Aether Scents",
    brandLogo: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=120&auto=format&fit=crop&q=80",
    bannerImage: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80",
    updateType: "product_add",
    updateText: "Aether Scents added a new seasonal candle collection — Wild Pine & Amber.",
    created_at: "2026-07-03T06:00:00Z",
    views: 730,
    saves: 88,
    rating: 4.6,
    ai_tags: ["apothecary", "handmade", "natural", "seasonal", "candles"]
  },
  {
    id: "feed-p12",
    type: "product",
    productId: "p12",
    name: "Blown Stained Glass Pendant Lamp",
    price: 420,
    image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=500&auto=format&fit=crop&q=80",
    brandId: "zephyr-glass",
    brandName: "Zephyr Glass",
    brandLogo: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=120&auto=format&fit=crop&q=80",
    created_at: "2026-06-27T11:00:00Z",
    views: 2800,
    saves: 330,
    rating: 4.8,
    ai_tags: ["lighting", "handmade", "glass", "interior", "design"]
  }
];

// Helper to fetch feed items (merging initial mocks and any session localStorage updates)
export function getFeedItems() {
  if (typeof window === "undefined") return MOCK_INITIAL_FEED_ITEMS;
  try {
    const saved = localStorage.getItem("cc_brand_updates");
    if (!saved) return MOCK_INITIAL_FEED_ITEMS;
    const updates = JSON.parse(saved);
    // Combine mock items with user-generated brand updates
    return [...updates, ...MOCK_INITIAL_FEED_ITEMS];
  } catch (e) {
    console.error("Failed to load feed updates", e);
    return MOCK_INITIAL_FEED_ITEMS;
  }
}

/**
 * Ranks feed items based on role-specific weights and overlap with user tags.
 * 
 * score = (tagAffinity * w1) + (recencyDecay * w2) + (engagementNorm * w3) + (socialProof * w4) + (diversityBonus * w5)
 * 
 * @param {Array} items - The feed items (already decorated with page-load diversity bonus)
 * @param {String} role - "customer" | "brand" | "creator"
 * @param {Array} userTags - The active user's preference tags / niches (array of strings)
 */
export function rankFeed(items, role, userTags = []) {
  if (!items || items.length === 0) return [];

  // Normalize user tags to lowercase
  const targetTags = userTags.map(t => t.toLowerCase().trim()).filter(Boolean);

  // Define role weights
  const weights = {
    customer: { w1: 0.4, w2: 0.1, w3: 0.1, w4: 0.35, w5: 0.05 }, // High Tag Overlap & Social Proof
    brand:    { w1: 0.4, w2: 0.1, w3: 0.35, w4: 0.1, w5: 0.05 }, // High Tag Overlap & Engagement
    creator:  { w1: 0.1, w2: 0.4, w3: 0.35, w4: 0.1, w5: 0.05 }, // High Recency & Engagement
  };

  const w = weights[role] || weights.customer;

  // Find max values in list for normalization of engagement (views + saves * 5)
  let maxEngagement = 1;
  items.forEach(item => {
    const eng = (item.views || 0) + (item.saves || 0) * 5;
    if (eng > maxEngagement) maxEngagement = eng;
  });

  const scoredItems = items.map(item => {
    // 1. Tag Affinity (0 to 1)
    let tagAffinity = 0;
    if (targetTags.length > 0 && item.ai_tags && item.ai_tags.length > 0) {
      const matchCount = item.ai_tags.filter(t => targetTags.includes(t.toLowerCase())).length;
      tagAffinity = matchCount / Math.max(1, targetTags.length);
    }

    // 2. Recency Decay (0 to 1)
    const ageInDays = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const recencyDecay = Math.exp(-0.1 * Math.max(0, ageInDays)); // Exponential falloff

    // 3. Engagement Normalization (0 to 1)
    const rawEngagement = (item.views || 0) + (item.saves || 0) * 5;
    const engagementNorm = rawEngagement / maxEngagement;

    // 4. Social Proof (0 to 1)
    const ratingFactor = (item.rating || 4.5) / 5; // 0.9 to 1.0 mostly
    const savesFactor = Math.min(1, (item.saves || 0) / 1000);
    const socialProof = ratingFactor * 0.6 + savesFactor * 0.4;

    // 5. Diversity Bonus (pinned value 0 to 0.1 passed from state)
    const diversityBonus = item.diversityBonus || 0;

    // Calculate final score
    const finalScore = 
      (tagAffinity * w.w1) + 
      (recencyDecay * w.w2) + 
      (engagementNorm * w.w3) + 
      (socialProof * w.w4) + 
      (diversityBonus * w.w5);

    // Derive a cosmetic reason string
    let reason = "Trending Now";
    if (tagAffinity > 0.3) {
      reason = "Matches your style";
    } else if (recencyDecay > 0.8) {
      reason = "New Release";
    } else if (socialProof > 0.8) {
      reason = "Highly Recommended";
    }

    return {
      ...item,
      score: finalScore,
      reason,
      debug: {
        tagAffinity,
        recencyDecay,
        engagementNorm,
        socialProof,
        diversityBonus
      }
    };
  });

  // Sort descending by score
  return scoredItems.sort((a, b) => b.score - a.score);
}
