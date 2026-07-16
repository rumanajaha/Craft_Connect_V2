import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { checkCreatorQuota } from '@/lib/quotaHelper';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { niche } = body;

    const supabase = getSupabaseRouteClient();
    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    // Check creator quota for 'trending-feed'
    const quota = await checkCreatorQuota(creator.id, 'trending-feed');
    if (quota.exceeded) {
      return NextResponse.json({
        error: 'Quota exceeded',
        message: `You have used all of your ${quota.limit} free generations for this tool this month. Please upgrade to Pro.`
      }, { status: 429 });
    }

    const placeholderText = "AI generation coming soon";

    // Log the generation usage
    await supabaseAdmin
      .from('AIGeneration')
      .insert({
        creator_id: creator.id,
        tool_name: 'trending-feed',
        input_json: { niche: niche || '' },
        output_text: placeholderText
      });

    return NextResponse.json({
      success: true,
      message: placeholderText,
      result: null,
      remaining: Math.max(0, quota.limit - quota.count - 1)
    });

  } catch (error) {
    console.error("AI Trending POST error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
