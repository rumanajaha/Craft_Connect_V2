import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { checkCreatorQuota } from '@/lib/quotaHelper';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { niche } = body;

    const supabase = getSupabaseRouteClient();
    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('id, niches')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    // Check creator quota for 'trending-feed'
    const quota = await checkCreatorQuota(creator.id, 'trending-feed');
    if (quota.exceeded) {
      return NextResponse.json({
        error: 'Quota exceeded',
        message: `You have used all of your ${quota.limit} free generations for this tool this month. Please upgrade to Pro.`
      }, { status: 429 });
    }

    const creatorNiches = niche || (Array.isArray(creator.niches) ? creator.niches.join(', ') : creator.niches) || 'Handmade & Artisan';

    // Real tag-aggregation query across BrandProfile.ai_tags and Product.category (no Gemini call)
    const [brandsRes, productsRes] = await Promise.all([
      supabaseAdmin.from('BrandProfile').select('brand_name, ai_tags, category'),
      supabaseAdmin.from('Product').select('category')
    ]);

    if (brandsRes.error) {
      console.error('Trending BrandProfile query error:', brandsRes.error);
      return NextResponse.json({ error: 'Failed to aggregate trending tags' }, { status: 500 });
    }

    const tagCounts = {};
    const addTag = (raw) => {
      if (typeof raw !== 'string') return;
      const normalized = raw.trim().toLowerCase();
      if (normalized) {
        tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
      }
    };

    (brandsRes.data || []).forEach((brand) => {
      if (Array.isArray(brand.ai_tags)) {
        brand.ai_tags.forEach(addTag);
      }
      if (brand.category) addTag(brand.category);
    });

    (productsRes.data || []).forEach((product) => {
      if (product.category) addTag(product.category);
    });

    const trendingTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({
        tag: tag.charAt(0).toUpperCase() + tag.slice(1),
        count
      }));

    const formattedResult = trendingTags.length > 0
      ? `Top Trending CraftConnect Tags & Categories (based on live platform data):\n\n` +
        trendingTags
          .map((item, idx) => `${idx + 1}. #${item.tag} — ${item.count} listing${item.count === 1 ? '' : 's'}`)
          .join('\n') +
        `\n\nTip: Align your next post in "${creatorNiches}" with the top 2–3 tags above to increase brand discovery.`
      : `No platform tags have been indexed yet. Check back as more brands add products and tags.`;

    // Log to AIGeneration only after the query succeeds
    await supabaseAdmin
      .from('AIGeneration')
      .insert({
        creator_id: creator.id,
        tool_name: 'trending-feed',
        input_json: { niche: creatorNiches },
        output_text: JSON.stringify(trendingTags)
      });

    return NextResponse.json({
      success: true,
      trendingTags,
      result: formattedResult,
      remaining: Math.max(0, quota.limit - quota.count - 1)
    });

  } catch (error) {
    console.error('AI Trending POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
