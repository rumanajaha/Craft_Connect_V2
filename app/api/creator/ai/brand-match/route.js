import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { checkCreatorQuota } from '@/lib/quotaHelper';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { generateWithGemini, GeminiUnavailableError } from '@/lib/gemini';

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
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

    // Fetch real brands from the platform to match against
    const { data: brands } = await supabaseAdmin
      .from('BrandProfile')
      .select('id, brand_name, category, location, ai_tags, description')
      .limit(30);

    const creatorNiches = Array.isArray(creator.niches) ? creator.niches.join(', ') : (creator.niches || queryCategories || 'Handmade');
    const followerInfo = creator.follower_count ? `${creator.follower_count.toLocaleString()} followers` : 'a growing following';
    const erInfo = creator.engagement_rate ? `${creator.engagement_rate}% engagement rate` : 'strong engagement';

    // Build brand list for Gemini context
    const brandList = (brands || []).map((b, i) => {
      const tags = Array.isArray(b.ai_tags) ? b.ai_tags.join(', ') : '';
      return `${i + 1}. ${b.brand_name} | Category: ${b.category || 'General'} | Location: ${b.location || 'N/A'} | Tags: ${tags || 'handmade, artisan'}`;
    }).join('\n');

    const model = getGeminiModel();
    const prompt = `You are a collaboration strategist for handmade and artisan brands on CraftConnect, a platform connecting craft brands with content creators.

Creator profile:
- Niches: ${creatorNiches}
- Following: ${followerInfo}, ${erInfo}
- Preferred collaboration type: ${queryComp}
- Unique value: ${queryValue || 'authentic storytelling and slow-living aesthetic'}

Available brands on the platform:
${brandList || 'No brands available yet on the platform.'}

Based on the creator's profile, identify the top 3 most compatible brands from the list above. For each match:
1. Name the brand and explain WHY it is a good match (1-2 sentences)
2. Suggest a specific collaboration idea (e.g. gifting + reel, paid integration, barter)
3. Give a compatibility score (%)

Format clearly numbered (1. 2. 3.) with the brand name bold-ish on the first line. End with one sentence recommendation. Keep total under 250 words.`;

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
