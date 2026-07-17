import { NextResponse } from "next/server";
import { authenticate } from "@/middleware/auth";
import { getSupabaseRouteClient } from "@/lib/supabaseRouteHandler";

function getTagOverlap(userTags, itemTags) {
  if (!userTags || userTags.length === 0 || !itemTags || itemTags.length === 0) {
    return 0;
  }
  const userTagsSet = new Set(userTags.map(t => t.toLowerCase().trim()).filter(Boolean));
  const overlapCount = itemTags.filter(t => userTagsSet.has(t.toLowerCase().trim())).length;
  return overlapCount / Math.max(1, userTagsSet.size);
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
    if (!user || user.role !== "CREATOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = (page - 1) * limit;

    const supabase = getSupabaseRouteClient();

    // 1. Fetch creator profile to get tags
    const { data: creator } = await supabase
      .from("CreatorProfile")
      .select("id, ai_tags, niches")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    const creatorTags = (creator?.ai_tags || []).concat(creator?.niches || []);

    // 2. Fetch real Products
    const { data: dbProducts, error: productsError } = await supabase
      .from("Product")
      .select("*, BrandProfile(brand_name, logo_url, category, ai_tags)")
      .eq("status", "in_stock");

    if (productsError) {
      console.error("GET creator/feed Products DB error:", productsError);
    }

    // 3. Fetch real PortfolioItems
    const { data: dbPortfolioItems, error: portfolioError } = await supabase
      .from("PortfolioItem")
      .select("*, CreatorProfile(display_name, avatar_url, niches)");

    if (portfolioError) {
      console.error("GET creator/feed PortfolioItems DB error:", portfolioError);
    }

    // 4. Map & Merge both lists
    const merged = [];

    if (dbProducts) {
      dbProducts.forEach(p => {
        merged.push({
          id: p.id,
          type: "product",
          contentType: "product",
          productId: p.id,
          brandId: p.brand_id,
          name: p.name || "",
          price: p.price !== null ? Number(p.price) : 0,
          image: p.image_url || "",
          brandName: p.BrandProfile?.brand_name || "",
          brandLogo: p.BrandProfile?.logo_url || "",
          category: p.BrandProfile?.category || "",
          ai_tags: p.BrandProfile?.ai_tags || [],
          created_at: p.created_at,
          views: p.view_count || 0,
          saves: 0,
          rating: 4.9,
          description: p.description || "",
          buyLink: p.buy_link || ""
        });
      });
    }

    if (dbPortfolioItems) {
      dbPortfolioItems.forEach(pf => {
        merged.push({
          id: pf.id,
          type: "creator_content",
          contentType: "portfolio",
          creatorId: pf.creator_id,
          creatorName: pf.CreatorProfile?.display_name || "",
          creatorAvatar: pf.CreatorProfile?.avatar_url || "",
          portfolioImage: pf.media_url || "",
          caption: pf.description || "",
          description: pf.description || "",
          ai_tags: pf.CreatorProfile?.niches || [],
          created_at: pf.created_at,
          views: pf.view_count || 0,
          saves: 0,
          rating: 4.9
        });
      });
    }

    // 5. Score & Rank items at request-time
    let maxEngagement = 1;

    const scoredItems = merged.map(item => {
      const tagOverlap = getTagOverlap(creatorTags, item.ai_tags);
      const recencyDecay = getRecencyDecay(item.created_at);
      const rawEngagement = (item.views || 0) + (item.saves || 0) * 5;
      const engagementNorm = rawEngagement / maxEngagement;

      const score = (0.4 * tagOverlap) + (0.1 * recencyDecay) + (0.5 * engagementNorm);

      return {
        ...item,
        score,
        matchesStyle: score >= 0.45
      };
    });

    // Sort descending by score
    scoredItems.sort((a, b) => b.score - a.score);

    // 6. Paginate
    const paginated = scoredItems.slice(offset, offset + limit);
    const hasMore = offset + limit < scoredItems.length;

    return NextResponse.json({ items: paginated, hasMore });

  } catch (err) {
    console.error("GET /api/creator/feed error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
