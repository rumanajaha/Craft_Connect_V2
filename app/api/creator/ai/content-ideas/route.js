import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { checkCreatorQuota } from '@/lib/quotaHelper';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { generateWithGemini, GeminiUnavailableError } from '@/lib/gemini';

function parseIdeasArray(rawText) {
  const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      const strings = parsed
        .map((item) => (typeof item === 'string' ? item.trim() : String(item || '').trim()))
        .filter(Boolean);
      if (strings.length > 0) return strings;
    }
  } catch {
    // Fall back to line/numbered-item splitting if model didn't return strict JSON
  }

  const numbered = cleaned
    .split(/\n(?=\s*\d+[.)]\s+)/)
    .map((s) => s.replace(/^\s*\d+[.)]\s+/, '').trim())
    .filter(Boolean);

  if (numbered.length > 1) return numbered;

  return cleaned
    .split('\n')
    .map((s) => s.replace(/^[-*•]\s+/, '').trim())
    .filter(Boolean);
}

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

    const creatorNiches = niche || (Array.isArray(creator.niches) ? creator.niches.join(', ') : creator.niches) || 'Handmade & Artisan';
    const targetChannel = channel || 'Instagram';
    const topicContext = topic ? `Focus specifically on the topic: "${topic}".` : 'Cover a variety of engaging angles.';

    const prompt = `You are a creative content strategist for handmade and artisan creators. Generate 5 content hook ideas for a creator in the following niches: ${creatorNiches}.
${topicContext}
Target platform: ${targetChannel}.

Each string should contain a compelling scroll-stopping hook followed by a brief 1-sentence visual execution tip for an artisan/slow-living audience.

Return ONLY a valid JSON array of 5 plain strings with no markdown formatting or extra commentary. Example:
["Hook 1 — brief visual idea.", "Hook 2 — brief visual idea."]`;

    // generateWithGemini throws GeminiUnavailableError on failure — quota is NOT incremented
    const rawIdeas = await generateWithGemini(prompt);
    const ideas = parseIdeasArray(rawIdeas);
    const formattedResult = ideas.map((idea, i) => `${i + 1}. ${idea}`).join('\n\n');

    // Only log after a successful generation
    await supabaseAdmin
      .from('AIGeneration')
      .insert({
        creator_id: creator.id,
        tool_name: 'content-ideas',
        input_json: { topic: topic || '', channel: targetChannel, niche: creatorNiches },
        output_text: JSON.stringify(ideas)
      });

    return NextResponse.json({
      success: true,
      ideas,
      result: formattedResult,
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
