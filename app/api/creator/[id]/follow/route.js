import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { supabaseAdmin } from '@/lib/supabaseServer';

async function syncCreatorFollowerCount(creatorId) {
  const { count } = await supabaseAdmin
    .from('CreatorFollow')
    .select('follower_user_id', { count: 'exact', head: true })
    .eq('creator_id', creatorId);

  const realCount = count || 0;

  await supabaseAdmin
    .from('CreatorProfile')
    .update({ follower_count: realCount })
    .eq('id', creatorId);

  // Best-effort snapshot if FollowerHistory table exists
  await supabaseAdmin
    .from('FollowerHistory')
    .insert({ creator_id: creatorId, follower_count: realCount })
    .then(() => {})
    .catch(() => {});

  return realCount;
}

export async function POST(request, { params }) {
  try {
    const { id: creatorId } = await params;
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();

    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('id, owner_user_id')
      .eq('id', creatorId)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    if (creator.owner_user_id === user.id) {
      return NextResponse.json({ error: 'You cannot follow your own profile' }, { status: 400 });
    }

    const { error: insertError } = await supabase
      .from('CreatorFollow')
      .insert({
        creator_id: creatorId,
        follower_user_id: user.id,
      });

    if (insertError && insertError.code !== '23505') {
      console.error('POST /api/creator/[id]/follow error:', insertError);
      return NextResponse.json({ error: 'Failed to follow creator' }, { status: 500 });
    }

    const followerCount = await syncCreatorFollowerCount(creatorId);
    return NextResponse.json({ following: true, followerCount });
  } catch (err) {
    console.error('POST /api/creator/[id]/follow error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id: creatorId } = await params;
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();

    const { error: deleteError } = await supabase
      .from('CreatorFollow')
      .delete()
      .eq('creator_id', creatorId)
      .eq('follower_user_id', user.id);

    if (deleteError) {
      console.error('DELETE /api/creator/[id]/follow error:', deleteError);
      return NextResponse.json({ error: 'Failed to unfollow creator' }, { status: 500 });
    }

    const followerCount = await syncCreatorFollowerCount(creatorId);
    return NextResponse.json({ following: false, followerCount });
  } catch (err) {
    console.error('DELETE /api/creator/[id]/follow error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

