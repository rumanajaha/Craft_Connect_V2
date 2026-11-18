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

    const { category, aesthetic } = await request.json();

    if (!category || !aesthetic) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Monthly Quota Check for 'brand_tags'
    const quota = await checkQuota(brand.id, 'brand_tags');
    if (quota.exceeded) {
      return NextResponse.json({
        error: 'Quota exceeded',
        message: `You have used all of your ${quota.limit} free generations for this tool this month. Please upgrade to Pro.`
      }, { status: 429 });
    }

    // 2. Generate content using Gemini (throws GeminiUnavailableError on failure — quota NOT incremented)
    const prompt = `Generate 6 to 8 relevant search and search-indexing tags (one or two words each) for an artisanal/craft brand.
Brand Category: ${category}
Aesthetic & Values Keywords: ${aesthetic}

Return the tags ONLY as a valid JSON array of lowercase strings, without any extra text or code blocks. For example:
["handcrafted", "wabi-sabi", "stoneware", "minimalist", "organic"]`;

    const textOutput = await generateWithGemini(prompt);

    let tags = [];
    try {
      const cleanedText = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      tags = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Gemini tags output parsing error. Output was:", textOutput);
      tags = textOutput
        .replace(/[\[\]"]/g, '')
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      tags = [category.toLowerCase(), "handmade", "artisan", "design"];
    }

    // 3. Log usage in AIGeneration table (only after successful generation)
    const { error: logError } = await supabaseAdmin
      .from('AIGeneration')
      .insert({
        brand_id: brand.id,
        tool_name: 'brand_tags',
        input_json: { category, aesthetic },
        output_text: JSON.stringify(tags)
      });

    if (logError) {
      console.error("Failed to log AI usage:", logError);
    }

    return NextResponse.json({
      success: true,
      tags,
      remaining: Math.max(0, quota.limit - quota.count - 1)
    });

  } catch (error) {
    if (error instanceof GeminiUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("AI Tags generation error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
