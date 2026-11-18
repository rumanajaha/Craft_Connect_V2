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

    const { features, productId } = await request.json();

    if (!productId || !features) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Verify product belongs to this brand
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

    const prompt = `Write a concise, SEO-friendly product description (2-3 sentences) for "${product.name}" in category "${product.category || 'Handmade'}" with these features: ${features}.
Focus on tactile/sensory detail appropriate for a handmade product. Do not invent certifications, awards, or specific quantities not provided.

Then add 3 key bullet points (•) covering quality, materials, and care instructions.
Do not use markdown headers. Keep the total under 120 words.`;

    // generateWithGemini throws GeminiUnavailableError on failure — quota is NOT incremented
    const seoText = await generateWithGemini(prompt);

    // Only log after a successful generation
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
    if (error instanceof GeminiUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error('AI seo-description error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
