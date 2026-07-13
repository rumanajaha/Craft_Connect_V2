import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { getGeminiModel } from '@/lib/gemini';
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

    const model = getGeminiModel();
    const prompt = `Generate a compelling wabi-sabi brand story / about philosophy text for a brand named "${brand.brand_name}" which operates in the "${brand.category || 'Craft'}" category.
${collection ? `Collection/Focus: ${collection}` : ''}
Primary Craft Materials / Craft Type: ${materials || 'natural materials'}
Inspiration / Aesthetic Style: ${inspiration || 'slow living, hand-thrown'}
Tone of Voice: ${finalTone}

The story should be detailed, emotional, authentic, and highlight the beauty of slow-made, handcrafted goods. Format it as plain text with clean paragraphs. Do not use markdown headers, lists, or hashtags. Keep the length between 80 to 120 words.`;

    const genResult = await model.generateContent(prompt);
    const storyText = genResult.response.text().trim();

    if (!storyText) {
      return NextResponse.json({ error: 'Failed to generate brand story' }, { status: 500 });
    }

    // Log usage in AIGeneration table
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
    console.error("AI story generation error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
