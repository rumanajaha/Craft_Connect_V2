import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

/**
 * GET /api/creator/public/[id]
 * Public-safe read of a creator's profile and portfolio by CreatorProfile.id.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Creator ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseRouteClient();

    const [profileRes, portfolioRes] = await Promise.all([
      supabase
        .from('CreatorProfile')
        .select(
          'id, owner_user_id, display_name, bio, niches, ai_tags, follower_count, engagement_rate, avatar_url, location, instagram_url, tiktok_url, youtube_url'
        )
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('PortfolioItem')
        .select('id, creator_id, title, description, media_url, created_at, view_count')
        .eq('creator_id', id)
        .order('created_at', { ascending: false }),
    ]);

    if (profileRes.error || !profileRes.data) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    const c = profileRes.data;
    return NextResponse.json({
      profile: {
        ...c,
        tags: Array.isArray(c.ai_tags) ? c.ai_tags.join(', ') : '',
      },
      portfolio: portfolioRes.data || [],
    });
  } catch (error) {
    console.error('GET /api/creator/public/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

