import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { generateWithGemini, GeminiUnavailableError } from '@/lib/gemini';
import { checkQuota } from '@/lib/quotaHelper';

export async function POST(request) {
  try {
    const user = await authenticate(request);

    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: brand, error: brandError } = await supabaseAdmin
      .from('BrandProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Check monthly quota for 'content-inspiration'
    const quota = await checkQuota(brand.id, 'content-inspiration');
    if (quota.exceeded) {
      return NextResponse.json({
        error: 'Quota exceeded',
        message: `You have used all of your ${quota.limit} free generations for this tool this month. Please upgrade to Pro.`
      }, { status: 429 });
    }

    const prompt = `You are a creative director for handmade and artisan brands. Brainstorm 3 short-form video concepts for the following topic: "${text}"

For each idea provide:
- A compelling hook line (1 sentence to stop the scroll)
- A brief video angle / visual description (2 sentences)
- A short caption suggestion

Format clearly numbered (1. 2. 3.) with no markdown headers. Keep total under 150 words. Make ideas platform-ready for Instagram Reels or TikTok.`;

    // generateWithGemini throws GeminiUnavailableError on failure — quota is NOT incremented
    const inspirationText = await generateWithGemini(prompt);

    // Only log after a successful generation
    await supabaseAdmin
      .from('AIGeneration')
      .insert({
        brand_id: brand.id,
        tool_name: 'content-inspiration',
        input_json: body,
        output_text: inspirationText
      });

    return NextResponse.json({
      success: true,
      result: inspirationText,
      remaining: Math.max(0, quota.limit - quota.count - 1)
    });

  } catch (error) {
    if (error instanceof GeminiUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error('AI content-inspiration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
