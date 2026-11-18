import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { checkCreatorQuota } from '@/lib/quotaHelper';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { generateWithGemini, GeminiUnavailableError } from '@/lib/gemini';
import { matchByEmbedding } from '@/lib/matching';

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { categories, comp, value, brandCategories, preferredCompType, distinctValue, niche } = body;

    const queryCategories = categories || brandCategories || niche || '';
    const queryComp = comp || preferredCompType || 'paid';
    const queryValue = value || distinctValue || '';

    const supabase = getSupabaseRouteClient();
    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('id, niches, display_name, follower_count, engagement_rate')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    // Check creator quota for 'brand-match'
    const quota = await checkCreatorQuota(creator.id, 'brand-match');
    if (quota.exceeded) {
      return NextResponse.json({
        error: 'Quota exceeded',
        message: `You have used all of your ${quota.limit} free generations for this tool this month. Please upgrade to Pro.`
      }, { status: 429 });
    }

    const creatorNiches = Array.isArray(creator.niches) ? creator.niches.join(', ') : (creator.niches || queryCategories || 'Handmade');
    const followerInfo = creator.follower_count ? `${creator.follower_count.toLocaleString()} followers` : 'a growing following';
    const erInfo = creator.engagement_rate ? `${creator.engagement_rate}% engagement rate` : 'strong engagement';

    const queryText = [
      `Niches: ${creatorNiches}`,
      queryCategories ? `Categories: ${queryCategories}` : '',
      `Compensation: ${queryComp}`,
      queryValue ? `Value: ${queryValue}` : '',
    ].filter(Boolean).join('. ');

    let matchedBrands;
    try {
      matchedBrands = await matchByEmbedding(queryText, 'BrandProfile', { limit: 5 });
    } catch (matchErr) {
      console.error('Brand match embedding error:', matchErr);
      throw new GeminiUnavailableError('AI matching is temporarily unavailable, please try again.');
    }

    const topBrands = matchedBrands.slice(0, 3);

    const brandList = topBrands.map((b, i) => {
      const tags = Array.isArray(b.ai_tags) ? b.ai_tags.join(', ') : '';
      return `${i + 1}. ${b.name} (${b.matchPercent}% vector match) | Category: ${b.category} | Location: ${b.location} | Tags: ${tags || 'handmade, artisan'}`;
    }).join('\n');

    const prompt = `You are a collaboration strategist for handmade and artisan brands on CraftConnect, a platform connecting craft brands with content creators.

Creator profile:
- Niches: ${creatorNiches}
- Following: ${followerInfo}, ${erInfo}
- Preferred collaboration type: ${queryComp}
- Unique value: ${queryValue || 'authentic storytelling and slow-living aesthetic'}

Top vector-matched brands on the platform:
${brandList || 'No brands available yet on the platform.'}

For each matched brand above:
1. Name the brand with its match score (%) and explain WHY it fits this creator (1-2 sentences)
2. Suggest a specific collaboration idea (e.g. gifting + reel, paid integration, barter)

Format clearly numbered (1. 2. 3.) with the brand name on the first line. End with one sentence recommendation. Keep total under 250 words.`;

    // generateWithGemini throws GeminiUnavailableError on failure — quota is NOT incremented
    const matchText = await generateWithGemini(prompt);

    // Only log after a successful generation
    await supabaseAdmin
      .from('AIGeneration')
      .insert({
        creator_id: creator.id,
        tool_name: 'brand-match',
        input_json: { categories: queryCategories, comp: queryComp, value: queryValue },
        output_text: matchText
      });

    return NextResponse.json({
      success: true,
      matches: topBrands,
      result: matchText,
      remaining: Math.max(0, quota.limit - quota.count - 1)
    });

  } catch (error) {
    if (error instanceof GeminiUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error('AI Brand Match POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
