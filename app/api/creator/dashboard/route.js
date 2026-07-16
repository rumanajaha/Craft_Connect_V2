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

    // Retrieve CreatorProfile
    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('*')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    // 1. Get active_collabs count (status = 'accepted')
    const { count: active_collabs, error: activeError } = await supabase
      .from('CollabRequest')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creator.id)
      .eq('status', 'accepted');

    if (activeError) {
      console.error("active_collabs count error:", activeError);
    }

    // 2. Get pending_pitches count (status = 'pending' and direction = 'outgoing')
    const { count: pending_pitches, error: pendingError } = await supabase
      .from('CollabRequest')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creator.id)
      .eq('status', 'pending')
      .eq('direction', 'outgoing');

    if (pendingError) {
      console.error("pending_pitches count error:", pendingError);
    }

    // 3. Calculate monthly_growth from FollowerHistory over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const latestCount = creator.follower_count || 0;

    // Retrieve closest historical count <= 30 days ago
    const { data: histData } = await supabase
      .from('FollowerHistory')
      .select('follower_count, recorded_at')
      .eq('creator_id', creator.id)
      .lte('recorded_at', thirtyDaysAgo.toISOString())
      .order('recorded_at', { ascending: false })
      .limit(1);

    let monthly_growth = 0;
    if (histData && histData.length > 0) {
      const historicalCount = histData[0].follower_count;
      if (historicalCount > 0) {
        monthly_growth = ((latestCount - historicalCount) / historicalCount) * 100;
      }
    } else {
      // Fallback: use oldest log if it is at least 24 hours old
      const { data: oldestData } = await supabase
        .from('FollowerHistory')
        .select('follower_count, recorded_at')
        .eq('creator_id', creator.id)
        .order('recorded_at', { ascending: true })
        .limit(1);

      if (oldestData && oldestData.length > 0) {
        const oldestCount = oldestData[0].follower_count;
        const oldestTime = new Date(oldestData[0].recorded_at);
        const daysDiff = (new Date() - oldestTime) / (1000 * 60 * 60 * 24);
        if (daysDiff >= 1 && oldestCount > 0) {
          monthly_growth = ((latestCount - oldestCount) / oldestCount) * 100;
        }
      }
    }

    // Round to 1 decimal place
    monthly_growth = Math.round(monthly_growth * 10) / 10;

    return NextResponse.json({
      active_collabs: active_collabs || 0,
      pending_pitches: pending_pitches || 0,
      monthly_growth: monthly_growth >= 0 ? `+${monthly_growth}%` : `${monthly_growth}%`
    });

  } catch (error) {
    console.error("Creator Dashboard API error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
