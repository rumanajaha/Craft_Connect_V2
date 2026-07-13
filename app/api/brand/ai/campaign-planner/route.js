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
    const { goal, budget, category } = body;

    if (!goal || !budget || !category) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Check monthly quota for 'campaign-planner'
    const quota = await checkQuota(brand.id, 'campaign-planner');
    if (quota.exceeded) {
      return NextResponse.json({
        error: 'Quota exceeded',
        message: `You have used all of your ${quota.limit} free generations for this tool this month. Please upgrade to Pro.`
      }, { status: 429 });
    }

    const model = getGeminiModel();
    const prompt = `Generate a detailed week-by-week influencer collaboration plan for a brand campaign.
Campaign Goal: ${goal}
Budget Range: ${budget}
Product Category: ${category}

Format it as clean markdown highlighting actions for Week 1 (Seeding), Week 2 (Teaser), Week 3 (Peak Launch), and Week 4 (Follow-Up). Keep the total length around 120-150 words. Do not use generic placeholders.`;

    const genResult = await model.generateContent(prompt);
    const planText = genResult.response.text().trim();

    if (!planText) {
      return NextResponse.json({ error: 'Failed to generate campaign plan' }, { status: 500 });
    }

    // Log usage in AIGeneration table
    await supabaseAdmin
      .from('AIGeneration')
      .insert({
        brand_id: brand.id,
        tool_name: 'campaign-planner',
        input_json: body,
        output_text: planText
      });

    return NextResponse.json({
      success: true,
      result: planText,
      remaining: Math.max(0, quota.limit - quota.count - 1)
    });

  } catch (error) {
    console.error("AI campaign planner error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
