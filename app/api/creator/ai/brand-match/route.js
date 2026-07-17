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

    const body = await request.json();
    const { categories, comp, value, brandCategories, preferredCompType, distinctValue } = body;

    const queryCategories = categories || brandCategories || "";
    const queryComp = comp || preferredCompType || "";
    const queryValue = value || distinctValue || "";

    const supabase = getSupabaseRouteClient();
    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    // Check creator quota for 'brand-match'
    const quota = await checkCreatorQuota(creator.id, 'brand-match');
    if (quota.exceeded) {
      return NextResponse.json({
        error: 'Quota exceeded',
        message: `You have used all of your ${quota.limit} free generations for this tool this month. Please upgrade to Pro.`
      }, { status: 429 });
    }

    const placeholderText = "AI matching coming soon";

    // Log the generation usage
    await supabaseAdmin
      .from('AIGeneration')
      .insert({
        creator_id: creator.id,
        tool_name: 'brand-match',
        input_json: { categories: queryCategories, comp: queryComp, value: queryValue },
        output_text: placeholderText
      });

    return NextResponse.json({
      success: true,
      message: placeholderText,
      matches: [],
      remaining: Math.max(0, quota.limit - quota.count - 1)
    });

  } catch (error) {
    console.error("AI Brand Match POST error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
