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

    const model = getGeminiModel();
    const prompt = `Analyze the following customer inquiry text. Extract the Intent, Confidence, Specific specifications requested, Budget if mentioned, Deadline if mentioned, and recommend a clear next action for the brand.
Inquiry: "${text}"

Format it as clean, readable text using standard bullet points. Keep it under 120 words.`;

    const genResult = await model.generateContent(prompt);
    const analysisText = genResult.response.text().trim();

    if (!analysisText) {
      return NextResponse.json({ error: 'Failed to analyze request' }, { status: 500 });
    }

    // Log usage in AIGeneration table
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
    console.error("AI request analyzer error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
