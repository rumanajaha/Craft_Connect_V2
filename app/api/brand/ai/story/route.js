import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { getGeminiModel } from '@/lib/gemini';

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

    const { materials, inspiration, tone } = await request.json();

    if (!materials || !inspiration || !tone) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Quota Check: count rows in AIGeneration for 'brand-story'
    const { count, error: countError } = await supabaseAdmin
      .from('AIGeneration')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brand.id)
      .eq('tool_name', 'brand-story');

    if (countError) {
      return NextResponse.json({ error: 'Failed to verify quota' }, { status: 500 });
    }

    if (count >= 3) {
      return NextResponse.json({
        error: 'Quota exceeded',
        message: 'You have used all of your 3 free generations for this tool. Please upgrade to Pro to unlock unlimited usage.'
      }, { status: 429 });
    }

    // 2. Generate content using Gemini
    const model = getGeminiModel();
    const prompt = `Generate a compelling wabi-sabi brand story for a brand named "${brand.brand_name}" which operates in the "${brand.category}" category.
Primary Craft Materials / Craft Type: ${materials}
Inspiration / Aesthetic Style: ${inspiration}
Tone of Voice: ${tone}

The story should be detailed, authentic, and highlight the beauty of slow-made, handcrafted goods. Format it as plain text with clean paragraphs. Do not use markdown headers, lists, or hashtags. Keep the length between 80 to 120 words.`;

    const genResult = await model.generateContent(prompt);
    const storyText = genResult.response.text().trim();

    if (!storyText) {
      return NextResponse.json({ error: 'Failed to generate story text' }, { status: 500 });
    }

    // 3. Log usage in AIGeneration table
    const { error: logError } = await supabaseAdmin
      .from('AIGeneration')
      .insert({
        brand_id: brand.id,
        tool_name: 'brand-story',
        input_json: { materials, inspiration, tone },
        output_text: storyText
      });

    if (logError) {
      console.error("Failed to log AI usage:", logError);
    }

    return NextResponse.json({
      success: true,
      story: storyText,
      remaining: Math.max(0, 3 - count - 1)
    });

  } catch (error) {
    console.error("AI Story generation error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
