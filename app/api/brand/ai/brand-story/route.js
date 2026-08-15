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
      .select('id, brand_name, category')
      .eq('owner_user_id', user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    // Check monthly quota for 'brand-story'
    const quota = await checkQuota(brand.id, 'brand-story');
    if (quota.exceeded) {
      return NextResponse.json({
        error: 'Quota exceeded',
        message: `You have used all of your ${quota.limit} free generations for this tool this month. Please upgrade to Pro.`
      }, { status: 429 });
    }

    const body = await request.json();
    const { collection, materials, inspiration, tone } = body;

    const finalTone = tone || 'Warm, authentic and narrative';

    const prompt = `Write a warm, authentic 2-3 paragraph brand story for a handmade goods brand named "${brand.brand_name}" in the "${brand.category || 'Craft'}" category.
${collection ? `Collection/Focus: ${collection}` : ''}
Materials / Craft Type: ${materials || 'natural materials'}
Inspiration / Aesthetic Style: ${inspiration || 'slow living, hand-thrown'}
Tone of Voice: ${finalTone}

The story should be emotional, authentic, and highlight the beauty of slow-made, handcrafted goods. Do not invent specific awards, certifications, or customer counts not provided. Do not use generic marketing clichés. Format as plain text with clean paragraphs — no markdown headers, lists, or hashtags. Keep the length between 80 to 120 words.`;

    // generateWithGemini throws GeminiUnavailableError on failure — quota is NOT incremented
    const storyText = await generateWithGemini(prompt);

    // Only log after a successful generation — failed calls do not count against quota
    await supabaseAdmin
      .from('AIGeneration')
      .insert({
        brand_id: brand.id,
        tool_name: 'brand-story',
        input_json: body,
        output_text: storyText
      });

    return NextResponse.json({
      success: true,
      result: storyText,
      remaining: Math.max(0, quota.limit - quota.count - 1)
    });

  } catch (error) {
    if (error instanceof GeminiUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error('AI brand-story error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
