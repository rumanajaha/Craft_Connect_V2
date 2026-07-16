import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

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

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    const isCronRequest = authHeader === `Bearer ${cronSecret}`;
    const isLocalDev = process.env.NODE_ENV === "development";

    if (!isCronRequest && !isLocalDev) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch all Brand profiles
    const { data: brands, error: brandsError } = await supabaseAdmin
      .from("BrandProfile")
      .select("id, owner_user_id, ai_tags");

    if (brandsError) {
      console.error("Error fetching brands for feed recomputation:", brandsError.message);
      return NextResponse.json({ error: "Database error fetching brands" }, { status: 500 });
    }

    // 2. Fetch all Creator profiles
    const { data: creators, error: creatorsError } = await supabaseAdmin
      .from("CreatorProfile")
      .select("id, owner_user_id, ai_tags, niches");

    if (creatorsError) {
      console.error("Error fetching creators for feed recomputation:", creatorsError.message);
      return NextResponse.json({ error: "Database error fetching creators" }, { status: 500 });
    }

    // 3. Fetch all FeedItem records
    const { data: feedItems, error: itemsError } = await supabaseAdmin
      .from("FeedItem")
      .select("*");

    if (itemsError || !feedItems || feedItems.length === 0) {
      console.error("Error or no feed items found for recomputation:", itemsError?.message);
      return NextResponse.json({ error: "No feed items found to rank" }, { status: 500 });
    }

    let maxEngagement = 1;
    feedItems.forEach(item => {
      const eng = (item.views || 0) + (item.saves || 0) * 5;
      if (eng > maxEngagement) {
        maxEngagement = eng;
      }
    });

    const w1 = 0.4;
    const w2 = 0.1;
    const w3 = 0.5;

    let totalComputed = 0;

    // 4. Compute for Brands
    for (const brand of brands) {
      if (!brand.owner_user_id) continue;

      const cacheEntries = feedItems.map(item => {
        const tagOverlap = getTagOverlap(brand.ai_tags, item.ai_tags);
        const recencyDecay = getRecencyDecay(item.created_at);
        const rawEngagement = (item.views || 0) + (item.saves || 0) * 5;
        const engagementNorm = rawEngagement / maxEngagement;

        const score = (w1 * tagOverlap) + (w2 * recencyDecay) + (w3 * engagementNorm);

        return {
          user_id: brand.owner_user_id,
          item_type: item.type,
          item_id: item.id,
          score: Math.min(1.0, Math.max(0.0, score)),
          computed_at: new Date().toISOString()
        };
      });

      await supabaseAdmin
        .from("FeedCache")
        .delete()
        .eq("user_id", brand.owner_user_id);

      const { error: insertError } = await supabaseAdmin
        .from("FeedCache")
        .insert(cacheEntries);

      if (insertError) {
        console.error(`Failed to insert FeedCache entries for brand ${brand.id}:`, insertError.message);
      } else {
        totalComputed += cacheEntries.length;
      }
    }

    // 5. Compute for Creators
    for (const creator of creators) {
      if (!creator.owner_user_id) continue;

      const creatorTags = (creator.ai_tags || []).concat(creator.niches || []);

      const cacheEntries = feedItems.map(item => {
        const tagOverlap = getTagOverlap(creatorTags, item.ai_tags);
        const recencyDecay = getRecencyDecay(item.created_at);
        const rawEngagement = (item.views || 0) + (item.saves || 0) * 5;
        const engagementNorm = rawEngagement / maxEngagement;

        const score = (w1 * tagOverlap) + (w2 * recencyDecay) + (w3 * engagementNorm);

        return {
          user_id: creator.owner_user_id,
          item_type: item.type,
          item_id: item.id,
          score: Math.min(1.0, Math.max(0.0, score)),
          computed_at: new Date().toISOString()
        };
      });

      await supabaseAdmin
        .from("FeedCache")
        .delete()
        .eq("user_id", creator.owner_user_id);

      const { error: insertError } = await supabaseAdmin
        .from("FeedCache")
        .insert(cacheEntries);

      if (insertError) {
        console.error(`Failed to insert FeedCache entries for creator ${creator.id}:`, insertError.message);
      } else {
        totalComputed += cacheEntries.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Recomputed ${totalComputed} cache feed items scores for ${brands.length} brands and ${creators.length} creators.`
    }, { status: 200 });

  } catch (err) {
    console.error("Feed recompute job error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
