import { NextResponse } from "next/server";
import { authenticate } from "@/middleware/auth";
import { getSupabaseRouteClient } from "@/lib/supabaseRouteHandler";
import { rankFeedByEmbedding, buildBrandViewerText } from "@/lib/feedHelpers";

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

    // 1. Fetch brand profile for viewer context (tags + category for embedding query)
    const { data: brand } = await supabase
      .from("BrandProfile")
      .select("ai_tags, category")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    const brandTags = brand?.ai_tags || [];
    const viewerText = brand ? buildBrandViewerText(brand) : '';

    // 2. Fetch Products — include embedding column for similarity scoring
    const { data: dbProducts, error: productsError } = await supabase
      .from("Product")
      .select("*, BrandProfile(brand_name, logo_url, category, ai_tags), embedding")
      .eq("status", "in_stock");

    if (productsError) {
      console.error("GET brand/feed Products DB error:", productsError);
    }

    // 3. Fetch PortfolioItems — include embedding column
    const { data: dbPortfolioItems, error: portfolioError } = await supabase
      .from("PortfolioItem")
      .select("*, CreatorProfile(display_name, avatar_url, niches), embedding");

    if (portfolioError) {
      console.error("GET brand/feed PortfolioItems DB error:", portfolioError);
    }

    // 4. Merge both lists — keep _embedding as internal field for ranking
    const merged = [];

    (dbProducts || []).forEach(p => {
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
        buyLink: p.buy_link || "",
        _embedding: p.embedding || null
      });
    });

    (dbPortfolioItems || []).forEach(pf => {
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
        rating: 4.9,
        _embedding: pf.embedding || null
      });
    });

    // 5. Rank by embedding cosine similarity (falls back to tag overlap per item if no embedding)
    const scoredItems = await rankFeedByEmbedding(merged, viewerText, brandTags);

    // 6. Paginate
    const paginated = scoredItems.slice(offset, offset + limit);
    const hasMore = offset + limit < scoredItems.length;

    return NextResponse.json({ items: paginated, hasMore });

  } catch (err) {
    console.error("GET /api/brand/feed error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
