import { NextResponse } from "next/server";
import { authenticate } from "@/middleware/auth";
import { getSupabaseRouteClient } from "@/lib/supabaseRouteHandler";
import { supabaseAdmin } from "@/lib/supabaseServer";

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

async function recomputeFeedCacheInline(userId, brandId, brandTags) {
  try {
    const { data: feedItems } = await supabaseAdmin
      .from("FeedItem")
      .select("*");

    if (!feedItems || feedItems.length === 0) return [];

    let maxEngagement = 1;
    feedItems.forEach(item => {
      const eng = (item.views || 0) + (item.saves || 0) * 5;
      if (eng > maxEngagement) maxEngagement = eng;
    });

    const w1 = 0.4;
    const w2 = 0.1;
    const w3 = 0.5;

    const cacheEntries = feedItems.map(item => {
      const tagOverlap = getTagOverlap(brandTags, item.ai_tags);
      const recencyDecay = getRecencyDecay(item.created_at);
      const rawEngagement = (item.views || 0) + (item.saves || 0) * 5;
      const engagementNorm = rawEngagement / maxEngagement;

      const score = (w1 * tagOverlap) + (w2 * recencyDecay) + (w3 * engagementNorm);

      return {
        user_id: userId,
        item_type: item.type,
        item_id: item.id,
        score: Math.min(1.0, Math.max(0.0, score)),
        computed_at: new Date().toISOString()
      };
    });

    await supabaseAdmin
      .from("FeedCache")
      .delete()
      .eq("user_id", userId);

    await supabaseAdmin
      .from("FeedCache")
      .insert(cacheEntries);

    return cacheEntries.sort((a, b) => b.score - a.score);
  } catch (err) {
    console.error("Inline feed cache recompute failed:", err);
    return [];
  }
}

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== "BRANDOWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = (page - 1) * limit;

    const supabase = getSupabaseRouteClient();

    let { data: cache, error: cacheError } = await supabase
      .from("FeedCache")
      .select("item_id, score, computed_at")
      .eq("user_id", user.id)
      .order("score", { ascending: false });

    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const isStale = !cache || cache.length === 0 ||
      (cache[0] && (now.getTime() - new Date(cache[0].computed_at).getTime()) > oneDayMs);

    if (isStale) {
      const { data: brand } = await supabase
        .from("BrandProfile")
        .select("id, ai_tags")
        .eq("owner_user_id", user.id)
        .single();

      const brandTags = brand?.ai_tags || [];
      const brandId = brand?.id || null;

      const computedCache = await recomputeFeedCacheInline(user.id, brandId, brandTags);
      cache = computedCache.map(c => ({ item_id: c.item_id, score: c.score }));
    }

    if (!cache || cache.length === 0) {
      return NextResponse.json({ items: [], hasMore: false });
    }

    const paginatedCache = cache.slice(offset, offset + limit);
    const hasMore = offset + limit < cache.length;

    if (paginatedCache.length === 0) {
      return NextResponse.json({ items: [], hasMore });
    }

    const itemIds = paginatedCache.map(c => c.item_id);

    const { data: items, error: itemsError } = await supabase
      .from("FeedItem")
      .select("*")
      .in("id", itemIds);

    if (itemsError || !items) {
      console.error("Error fetching feed items details:", itemsError?.message);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const scoreMap = new Map(paginatedCache.map(c => [c.item_id, c.score]));

    const formattedItems = items
      .map(item => {
        const score = scoreMap.get(item.id) || 0;
        const matchesStyle = score >= 0.45;

        return {
          id: item.id,
          type: item.type,
          productId: item.product_id || null,
          creatorId: item.creator_id || null,
          brandId: item.brand_id || null,
          name: item.name || null,
          price: item.price || null,
          image: item.image || null,
          brandName: item.brand_name || null,
          brandLogo: item.brand_logo || null,
          creatorName: item.creator_name || null,
          creatorAvatar: item.creator_avatar || null,
          portfolioImage: item.portfolio_image || null,
          caption: item.caption || null,
          updateType: item.update_type || null,
          updateText: item.update_text || null,
          bannerImage: item.banner_image || null,
          views: item.views,
          saves: item.saves,
          rating: item.rating,
          ai_tags: item.ai_tags || [],
          created_at: item.created_at,
          score,
          matchesStyle
        };
      })
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({ items: formattedItems, hasMore });

  } catch (err) {
    console.error("GET /api/brand/feed error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
