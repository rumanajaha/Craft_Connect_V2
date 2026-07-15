import { NextResponse } from "next/server";
import { authenticate } from "@/middleware/auth";
import { getSupabaseRouteClient } from "@/lib/supabaseRouteHandler";
import { getFeedItems } from "@/lib/feedRanking";

function getTagOverlap(brandTags, itemTags) {
  if (!brandTags || brandTags.length === 0 || !itemTags || itemTags.length === 0) {
    return 0;
  }
  const brandTagsSet = new Set(brandTags.map(t => t.toLowerCase().trim()).filter(Boolean));
  const overlapCount = itemTags.filter(t => brandTagsSet.has(t.toLowerCase().trim())).length;
  return overlapCount / Math.max(1, brandTagsSet.size);
}

function getRecencyDecay(createdAtString) {
  const itemDate = new Date(createdAtString);
  const now = new Date();
  const ageInDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-0.1 * Math.max(0, ageInDays));
}

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== "BRANDOWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = (page - 1) * limit;

    const supabase = getSupabaseRouteClient();

    const { data: brand } = await supabase
      .from("BrandProfile")
      .select("ai_tags")
      .eq("owner_user_id", user.id)
      .single();

    const brandTags = brand?.ai_tags || [];

    let feedItems;
    const { data, error: itemsError } = await supabase
      .from("FeedItem")
      .select("*");

    if (itemsError || !data || data.length === 0) {
      console.warn("FeedItem table not found or empty during search, using mock data fallback.");
      feedItems = getFeedItems();
    } else {
      feedItems = data;
    }

    const filtered = feedItems.filter(item => {
      if (!query) return true;

      const name = (item.name || "").toLowerCase();
      const brandName = (item.brand_name || "").toLowerCase();
      const creatorName = (item.creator_name || "").toLowerCase();
      const caption = (item.caption || "").toLowerCase();
      const updateText = (item.update_text || "").toLowerCase();
      const tags = (item.ai_tags || []).join(" ").toLowerCase();

      return name.includes(query) ||
        brandName.includes(query) ||
        creatorName.includes(query) ||
        caption.includes(query) ||
        updateText.includes(query) ||
        tags.includes(query);
    });

    let maxEngagement = 1;
    feedItems.forEach(item => {
      const eng = (item.views || 0) + (item.saves || 0) * 5;
      if (eng > maxEngagement) maxEngagement = eng;
    });

    const w1 = 0.4;
    const w2 = 0.1;
    const w3 = 0.5;

    const scored = filtered.map(item => {
      const tagOverlap = getTagOverlap(brandTags, item.ai_tags);
      const recencyDecay = getRecencyDecay(item.created_at);
      const rawEngagement = (item.views || 0) + (item.saves || 0) * 5;
      const engagementNorm = rawEngagement / maxEngagement;

      const score = (w1 * tagOverlap) + (w2 * recencyDecay) + (w3 * engagementNorm);

      return {
        id: item.id,
        type: item.type,
        productId: item.product_id || item.productId || null,
        creatorId: item.creator_id || item.creatorId || null,
        brandId: item.brand_id || item.brandId || null,
        name: item.name || null,
        price: item.price || null,
        image: item.image || null,
        brandName: item.brand_name || item.brandName || null,
        brandLogo: item.brand_logo || item.brandLogo || null,
        creatorName: item.creator_name || item.creatorName || null,
        creatorAvatar: item.creator_avatar || item.creatorAvatar || null,
        portfolioImage: item.portfolio_image || item.portfolioImage || null,
        caption: item.caption || null,
        updateType: item.update_type || item.updateType || null,
        updateText: item.update_text || item.updateText || null,
        bannerImage: item.banner_image || item.bannerImage || null,
        views: item.views,
        saves: item.saves,
        rating: item.rating,
        ai_tags: item.ai_tags || [],
        created_at: item.created_at,
        score,
        matchesStyle: score >= 0.45
      };
    }).sort((a, b) => b.score - a.score);

    const paginated = scored.slice(offset, offset + limit);
    const hasMore = offset + limit < scored.length;

    return NextResponse.json({ items: paginated, hasMore });

  } catch (err) {
    console.error("GET /api/brand/feed/search error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
