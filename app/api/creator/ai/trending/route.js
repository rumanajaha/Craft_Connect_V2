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

    const model = getGeminiModel();
    const prompt = `You are a social media trend analyst specialising in handmade goods, slow living, and artisan content.

A content creator works in these niches: ${creatorNiches}.

Identify 3 trending content formats or creative angles that are performing well right now on platforms like Instagram Reels, TikTok, and Pinterest for this type of creator.

For each trend:
1. Give it a short name/title
2. Briefly describe the format or angle (2-3 sentences)
3. Suggest a specific hook line they could use
4. Name the best platform for it

Format clearly numbered (1. 2. 3.). End with one actionable recommendation for what to try first this week. Keep total under 280 words. Sound practical and specific, not generic.`;

    // generateWithGemini throws GeminiUnavailableError on failure — quota is NOT incremented
    const trendingText = await generateWithGemini(prompt);

    // Only log after a successful generation
    await supabaseAdmin
      .from('AIGeneration')
      .insert({
        creator_id: creator.id,
        tool_name: 'trending-feed',
        input_json: { niche: creatorNiches },
        output_text: trendingText
      });

    return NextResponse.json({
      success: true,
      result: trendingText,
      remaining: Math.max(0, quota.limit - quota.count - 1)
    });

  } catch (error) {
    if (error instanceof GeminiUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error('AI Trending POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
