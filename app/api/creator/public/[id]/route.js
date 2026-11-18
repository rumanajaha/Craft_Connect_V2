import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

/**
 * GET /api/creator/public/[id]
 * Public-safe read of a creator's profile and portfolio by CreatorProfile.id,
 * with real follower count derived from CreatorFollow and viewer's isFollowing state.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Creator ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseRouteClient();

    const [profileRes, portfolioRes, followCountRes] = await Promise.all([
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
      supabase
        .from('CreatorFollow')
        .select('follower_user_id', { count: 'exact', head: true })
        .eq('creator_id', id),
    ]);

    if (profileRes.error || !profileRes.data) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    let isFollowing = false;
    let viewerUserId = null;
    try {
      const user = await authenticate(request);
      if (user) {
        viewerUserId = user.id;
        const { data: followRow } = await supabase
          .from('CreatorFollow')
          .select('creator_id')
          .eq('creator_id', id)
          .eq('follower_user_id', user.id)
          .maybeSingle();
        isFollowing = Boolean(followRow);
      }
    } catch (_) {}

    const realFollowerCount =
      !followCountRes.error && typeof followCountRes.count === 'number'
        ? followCountRes.count
        : 0;

    const c = profileRes.data;
    return NextResponse.json({
      profile: {
        ...c,
        follower_count: realFollowerCount,
        followers: realFollowerCount,
        isFollowing,
        isOwnProfile: viewerUserId ? c.owner_user_id === viewerUserId : false,
        tags: Array.isArray(c.ai_tags) ? c.ai_tags.join(', ') : '',
      },
      portfolio: portfolioRes.data || [],
    });
  } catch (error) {
    console.error('GET /api/creator/public/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
