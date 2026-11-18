import { NextResponse } from "next/server";
import { authenticate } from "@/middleware/auth";
import { getSupabaseRouteClient } from "@/lib/supabaseRouteHandler";
import { searchUsers } from "@/lib/searchUsers";

function matchesQuery(cleanQ, fields = [], tags = []) {
  if (!cleanQ) return true;
  if (fields.some((f) => typeof f === "string" && f.toLowerCase().includes(cleanQ))) {
    return true;
  }
  if (
    Array.isArray(tags) &&
    tags.some((t) => typeof t === "string" && t.toLowerCase().includes(cleanQ))
  ) {
    return true;
  }
  return false;
}

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || searchParams.get("query") || "").trim();
    const cleanQ = q.toLowerCase().replace(/^#/, "");
    const type = (searchParams.get("type") || "all").toLowerCase().trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const offset = (page - 1) * limit;

    const supabase = getSupabaseRouteClient();

    // 1. Reuse shared user/profile search (brands + creators)
    const matchedUsers = await searchUsers(supabase, {
      q,
      type,
      currentUserId: user.id,
    });

    const matchedBrandIds = new Set(
      matchedUsers.filter((u) => u.profileType === "brand").map((u) => u.id)
    );
    const matchedCreatorIds = new Set(
      matchedUsers.filter((u) => u.profileType === "creator").map((u) => u.id)
    );

    const includeProducts = type === "all" || type === "brand" || type === "brands" || type === "product";
    const includePortfolio = type === "all" || type === "creator" || type === "creators" || type === "portfolio";

    const [productsRes, portfolioRes] = await Promise.all([
      includeProducts
        ? supabase
            .from("Product")
            .select("*, BrandProfile(brand_name, logo_url, category, ai_tags)")
            .eq("status", "in_stock")
        : Promise.resolve({ data: [], error: null }),
      includePortfolio
        ? supabase
            .from("PortfolioItem")
            .select("*, CreatorProfile(display_name, avatar_url, niches, ai_tags)")
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (productsRes.error) {
      console.error("GET brand/feed/search Products error:", productsRes.error);
    }
    if (portfolioRes.error) {
      console.error("GET brand/feed/search PortfolioItems error:", portfolioRes.error);
    }

    const items = [];

    // 2. Product matching (by name, description, category, tags, or matched BrandProfile)
    (productsRes.data || []).forEach((p) => {
      const brandTags = p.BrandProfile?.ai_tags || [];
      const isMatch =
        !cleanQ ||
        matchedBrandIds.has(p.brand_id) ||
        matchesQuery(
          cleanQ,
          [p.name, p.description, p.category, p.BrandProfile?.brand_name, p.BrandProfile?.category],
          brandTags
        );

      if (!isMatch) return;

      items.push({
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
        category: p.BrandProfile?.category || p.category || "",
        ai_tags: brandTags,
        created_at: p.created_at,
        views: p.view_count || 0,
        saves: 0,
        rating: 4.9,
        description: p.description || "",
        buyLink: p.buy_link || "",
      });
    });

    // 3. PortfolioItem matching (by title, description, tags/niches, or matched CreatorProfile)
    (portfolioRes.data || []).forEach((pf) => {
      const creatorNiches = pf.CreatorProfile?.niches || [];
      const creatorTags = pf.CreatorProfile?.ai_tags || [];
      const combinedTags = [...new Set([...creatorNiches, ...creatorTags])];

      const isMatch =
        !cleanQ ||
        matchedCreatorIds.has(pf.creator_id) ||
        matchesQuery(
          cleanQ,
          [pf.title, pf.description, pf.CreatorProfile?.display_name],
          combinedTags
        );

      if (!isMatch) return;

      items.push({
        id: pf.id,
        type: "creator_content",
        contentType: "portfolio",
        creatorId: pf.creator_id,
        creatorName: pf.CreatorProfile?.display_name || "",
        creatorAvatar: pf.CreatorProfile?.avatar_url || "",
        portfolioImage: pf.media_url || "",
        title: pf.title || "",
        caption: pf.description || "",
        description: pf.description || "",
        ai_tags: combinedTags,
        created_at: pf.created_at,
        views: pf.view_count || 0,
        saves: 0,
        rating: 4.9,
      });
    });

    items.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    const paginated = items.slice(offset, offset + limit);
    const hasMore = offset + limit < items.length;

    return NextResponse.json({
      items: paginated,
      hasMore,
      users: matchedUsers,
      total: items.length,
    });
  } catch (err) {
    console.error("GET /api/brand/feed/search error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
