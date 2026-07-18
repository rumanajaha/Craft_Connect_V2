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
    let user;
    try {
      user = await authenticate(request);
    } catch (authError) {
      console.error("GET Customer Feed auth error:", authError.message || authError);
      return NextResponse.json({ error: 'Authentication failed', details: authError.message || String(authError) }, { status: 401 });
    }

    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = (page - 1) * limit;

    const supabase = getSupabaseRouteClient();

    // 1. Resolve customer's CustomerProfile.id
    const { data: customerProfile, error: profileError } = await supabase
      .from('CustomerProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .single();

    if (profileError || !customerProfile) {
      console.error("Failed to retrieve CustomerProfile ID for feed:", profileError?.message);
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    // 2. Fetch customer's saved brands to get their categories/tags
    const { data: savedBrands, error: savedError } = await supabase
      .from('SavedBrand')
      .select('brand_id, BrandProfile:brand_id ( category, ai_tags )')
      .eq('customer_id', customerProfile.id);

    if (savedError) {
      console.error("GET customer/feed SavedBrands DB error:", savedError.message);
      return NextResponse.json({ error: 'Failed to retrieve saved brands', details: savedError.message }, { status: 500 });
    }

    // Aggregate tags and categories of saved brands to represent customer preferences
    const customerTags = [];
    if (savedBrands && savedBrands.length > 0) {
      savedBrands.forEach(item => {
        if (item.BrandProfile?.category) {
          customerTags.push(item.BrandProfile.category);
        }
        if (item.BrandProfile?.ai_tags) {
          customerTags.push(...item.BrandProfile.ai_tags);
        }
      });
    }


    // 2. Fetch real Products
    const { data: dbProducts, error: productsError } = await supabase
      .from("Product")
      .select("*, BrandProfile(brand_name, logo_url, category, ai_tags)")
      .eq("status", "in_stock");

    if (productsError) {
      console.error("GET customer/feed Products DB error:", productsError.message);
    }

    // 3. Fetch real PortfolioItems
    const { data: dbPortfolioItems, error: portfolioError } = await supabase
      .from("PortfolioItem")
      .select("*, CreatorProfile(display_name, avatar_url, niches)");

    if (portfolioError) {
      console.error("GET customer/feed PortfolioItems DB error:", portfolioError.message);
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

    // 5. Score & Rank items
    const maxEngagement = Math.max(1, ...merged.map(item => (item.views || 0) + (item.saves || 0) * 5));

    const scoredItems = merged.map(item => {
      const tagOverlap = getTagOverlap(customerTags, item.ai_tags);
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
    console.error("GET Customer Feed error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
