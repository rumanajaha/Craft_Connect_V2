import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { getCreatorMatches } from '@/lib/aiMatchesHelper';
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
    const { productType, audience, goal } = body;

    if (!productType || !audience || !goal) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Check monthly quota for 'creator-match'
    const quota = await checkQuota(brand.id, 'creator-match');
    if (quota.exceeded) {
      return NextResponse.json({
        error: 'Quota exceeded',
        message: `You have used all of your ${quota.limit} free generations for this tool this month. Please upgrade to Pro.`
      }, { status: 429 });
    }

    // Get real matches from our matching engine using text-embedding-004
    const matches = await getCreatorMatches({ productType, audience, goal });
    const topMatches = matches.slice(0, 3);

    // Format matches as a markdown report
    let report = `Based on your inputs, here are the top compatible creators matched from our platform:\n\n`;

    if (topMatches.length === 0) {
      report += `No creators were found matching these criteria in our database yet. Try broadening your category or audience keywords!`;
    } else {
      topMatches.forEach((m, idx) => {
        report += `### #${idx + 1} — ${m.name} (${m.compatibility}% Compatibility)\n`;
        report += `* **Niches:** ${m.niches.join(', ')}\n`;
        report += `* **Followers:** ${m.followers}\n`;
        report += `* **Engagement:** ${m.engagementRate}\n\n`;
      });
      report += `**Recommendation:** We recommend reaching out to **${topMatches[0].name}** first, as they have the highest compatibility score for your campaign goal.`;
    }

    // Log usage in AIGeneration table
    await supabaseAdmin
      .from('AIGeneration')
      .insert({
        brand_id: brand.id,
        tool_name: 'creator-match',
        input_json: body,
        output_text: report
      });

    // Send a notification if matches found
    if (topMatches.length > 0) {
      await supabaseAdmin
        .from('Notification')
        .insert({
          user_id: user.id,
          type: 'ai_match',
          title: 'New AI Creator Matches',
          body: `We found ${topMatches.length} new creators with a 90%+ compatibility score for your brand.`,
          is_read: false,
          related_entity_id: brand.id
        });
    }

    return NextResponse.json({
      success: true,
      result: report,
      remaining: Math.max(0, quota.limit - quota.count - 1)
    });

  } catch (error) {
    console.error("AI creator match error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
