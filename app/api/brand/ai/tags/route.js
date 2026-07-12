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

    // 1. Quota Check: count rows in AIGeneration for 'recommendation-tags'
    const { count, error: countError } = await supabaseAdmin
      .from('AIGeneration')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brand.id)
      .eq('tool_name', 'recommendation-tags');

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
    const prompt = `Generate 6 to 8 relevant search and search-indexing tags (one or two words each) for an artisanal/craft brand.
Brand Category: ${category}
Aesthetic & Values Keywords: ${aesthetic}

Return the tags ONLY as a valid JSON array of lowercase strings, without any extra text or code blocks. For example:
["handcrafted", "wabi-sabi", "stoneware", "minimalist", "organic"]`;

    const genResult = await model.generateContent(prompt);
    const textOutput = genResult.response.text().trim();

    // Clean up output to make sure it's valid JSON
    let tags = [];
    try {
      const cleanedText = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      tags = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Gemini tags output parsing error. Output was:", textOutput);
      // Fallback tags parsing if JSON parse failed
      tags = textOutput
        .replace(/[\[\]"]/g, '')
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      tags = [category.toLowerCase(), "handmade", "artisan", "design"];
    }

    // 3. Log usage in AIGeneration table
    const { error: logError } = await supabaseAdmin
      .from('AIGeneration')
      .insert({
        brand_id: brand.id,
        tool_name: 'recommendation-tags',
        input_json: { category, aesthetic },
        output_text: JSON.stringify(tags)
      });

    if (logError) {
      console.error("Failed to log AI usage:", logError);
    }

    return NextResponse.json({
      success: true,
      tags: tags,
      remaining: Math.max(0, 3 - count - 1)
    });

  } catch (error) {
    console.error("AI Tags generation error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
