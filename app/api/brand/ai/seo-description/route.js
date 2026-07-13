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
      .select('id')
      .eq('owner_user_id', user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    const { features, productId } = await request.json();

    if (!productId || !features) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Verify product exists and belongs to this brand
    const { data: product, error: productError } = await supabaseAdmin
      .from('Product')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product || product.brand_id !== brand.id) {
      return NextResponse.json({ error: 'Product not found or access forbidden' }, { status: 404 });
    }

    // Check quota for 'seo-description'
    const quota = await checkQuota(brand.id, 'seo-description');
    if (quota.exceeded) {
      return NextResponse.json({
        error: 'Quota exceeded',
        message: `You have used all of your ${quota.limit} free generations for this tool this month. Please upgrade to Pro.`
      }, { status: 429 });
    }

    const model = getGeminiModel();
    const prompt = `Generate an engaging, SEO-optimized product description for a product named "${product.name}" in category "${product.category || 'Handmade'}".
Key selling points & features: ${features}

Format it as clean, readable text with:
- An inviting introductory paragraph (1-2 sentences) about the craft style and appeal.
- 3 key bullet points focusing on quality, materials, and care.
Do not use markdown headers, just plain text and standard bullet points (•). Keep it concise, under 120 words.`;

    const genResult = await model.generateContent(prompt);
    const seoText = genResult.response.text().trim();

    if (!seoText) {
      return NextResponse.json({ error: 'Failed to generate SEO description' }, { status: 500 });
    }

    // Log usage in AIGeneration table
    await supabaseAdmin
      .from('AIGeneration')
      .insert({
        brand_id: brand.id,
        tool_name: 'seo-description',
        input_json: { features, productId },
        output_text: seoText
      });

    return NextResponse.json({
      success: true,
      result: seoText,
      remaining: Math.max(0, quota.limit - quota.count - 1)
    });

  } catch (error) {
    console.error("AI SEO description error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
