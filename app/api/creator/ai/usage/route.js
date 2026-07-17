import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();
    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    // Get first day of the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Query all matching AI generations in the current month
    const { data: usageData, error: usageError } = await supabase
      .from('AIGeneration')
      .select('tool_name')
      .eq('creator_id', creator.id)
      .gte('created_at', startOfMonth);

    if (usageError) {
      console.error("Creator AI usage fetch error:", usageError);
      return NextResponse.json({ error: 'Failed to retrieve AI usage' }, { status: 500 });
    }

    const counts = {
      'trending-feed': 0,
      'brand-match': 0,
      'content-ideas': 0,
    };

    (usageData || []).forEach(row => {
      if (counts[row.tool_name] !== undefined) {
        counts[row.tool_name]++;
      }
    });

    return NextResponse.json({ usage: counts });

  } catch (error) {
    console.error("GET /api/creator/ai/usage error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
