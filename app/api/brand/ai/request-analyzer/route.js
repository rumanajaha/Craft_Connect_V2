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

    // Check monthly quota for 'request-analyzer'
    const quota = await checkQuota(brand.id, 'request-analyzer');
    if (quota.exceeded) {
      return NextResponse.json({
        error: 'Quota exceeded',
        message: `You have used all of your ${quota.limit} free generations for this tool this month. Please upgrade to Pro.`
      }, { status: 429 });
    }

    const prompt = `Analyze the following customer inquiry for a handmade goods brand. Extract and clearly identify:
- Intent (what the customer is asking for)
- Confidence (how clear/actionable the request is: High / Medium / Low)
- Specific specifications requested (materials, size, style, quantity, etc.)
- Budget (if mentioned)
- Deadline (if mentioned)
- Recommended next action for the brand

Inquiry: "${text}"

Format as clean, readable bullet points. Keep it under 120 words. Be specific and avoid generic language.`;

    // generateWithGemini throws GeminiUnavailableError on failure — quota is NOT incremented
    const analysisText = await generateWithGemini(prompt);

    // Only log after a successful generation
    await supabaseAdmin
      .from('AIGeneration')
      .insert({
        brand_id: brand.id,
        tool_name: 'request-analyzer',
        input_json: body,
        output_text: analysisText
      });

    return NextResponse.json({
      success: true,
      result: analysisText,
      remaining: Math.max(0, quota.limit - quota.count - 1)
    });

  } catch (error) {
    if (error instanceof GeminiUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error('AI request-analyzer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
