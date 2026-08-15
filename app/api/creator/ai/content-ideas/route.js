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
    const { topic, channel, niche } = body;

    const supabase = getSupabaseRouteClient();
    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('id, niches, display_name')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    // Check creator quota for 'content-ideas'
    const quota = await checkCreatorQuota(creator.id, 'content-ideas');
    if (quota.exceeded) {
      return NextResponse.json({
        error: 'Quota exceeded',
        message: `You have used all of your ${quota.limit} free generations for this tool this month. Please upgrade to Pro.`
      }, { status: 429 });
    }

    // Build context from creator's actual profile
    const creatorNiches = niche || (Array.isArray(creator.niches) ? creator.niches.join(', ') : creator.niches) || 'Handmade & Artisan';
    const targetChannel = channel || 'Instagram';
    const topicContext = topic ? `Focus specifically on the topic: "${topic}".` : 'Cover a variety of engaging angles.';

    const model = getGeminiModel();
    const prompt = `You are a creative content strategist for handmade and artisan creators. Generate 5 content hook ideas for a creator in the following niches: ${creatorNiches}.
${topicContext}
Target platform: ${targetChannel}.

For each idea, provide:
- A compelling hook (1 sentence, designed to stop scrolling)
- A brief visual/execution description (1-2 sentences)
- Why it works for the artisan/slow-living audience

Format each idea clearly numbered (1. 2. 3. 4. 5.) with the hook on the first line. Keep total response under 300 words. Do not use markdown headers or excessive symbols.`;

    // generateWithGemini throws GeminiUnavailableError on failure — quota is NOT incremented
    const ideasText = await generateWithGemini(prompt);

    // Only log after a successful generation
    await supabaseAdmin
      .from('AIGeneration')
      .insert({
        creator_id: creator.id,
        tool_name: 'content-ideas',
        input_json: { topic: topic || '', channel: targetChannel, niche: creatorNiches },
        output_text: ideasText
      });

    return NextResponse.json({
      success: true,
      result: ideasText,
      remaining: Math.max(0, quota.limit - quota.count - 1)
    });

  } catch (error) {
    if (error instanceof GeminiUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error('AI Content Ideas POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
