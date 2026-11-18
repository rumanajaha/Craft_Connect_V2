import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { createNotification, resolveSenderName } from '@/lib/notify';
import { findOrCreateThread } from '@/lib/messages';
import { supabaseAdmin } from '@/lib/supabaseServer';

/**
 * PATCH /api/creator/pitches/[id]
 * Creator accepts or declines a brand-initiated collaboration proposal (direction: 'incoming').
 * Updates CollabRequest status via session client, inserts "[SYSTEM] Collaboration accepted/declined"
 * in the thread, and notifies the brand owner (shared type: 'pitch_status').
 */
export async function PATCH(request, { params }) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!status || !['accepted', 'declined', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const dbStatus = status === 'rejected' ? 'declined' : status;

    const supabase = getSupabaseRouteClient();

    // 1. Derive CreatorProfile from authenticated session
    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('id, display_name')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    // 2. Verify CollabRequest belongs to this creator
    const { data: collabRequest, error: collabError } = await supabase
      .from('CollabRequest')
      .select('*')
      .eq('id', id)
      .eq('creator_id', creator.id)
      .maybeSingle();

    if (collabError || !collabRequest) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // 3. Update status via session client (enforced by creator-can-update RLS policy)
    const { data: updatedRequest, error: updateError } = await supabase
      .from('CollabRequest')
      .update({ status: dbStatus })
      .eq('id', id)
      .eq('creator_id', creator.id)
      .select()
      .single();

    if (updateError) {
      console.error('PATCH /api/creator/pitches/[id] update error:', updateError);
      return NextResponse.json({ error: 'Failed to update proposal status' }, { status: 500 });
    }

    // 4. Fetch BrandProfile owner_user_id
    const { data: brand } = await supabase
      .from('BrandProfile')
      .select('owner_user_id, brand_name')
      .eq('id', collabRequest.brand_id)
      .maybeSingle();

    let threadId = null;
    if (brand?.owner_user_id) {
      const creatorName = creator.display_name || (await resolveSenderName(user.id, user.email));
      const actionText = dbStatus === 'accepted' ? 'accepted' : 'declined';

      // Insert "[SYSTEM] Collaboration accepted/declined" in the thread
      try {
        threadId = await findOrCreateThread(user.id, brand.owner_user_id);
        const systemMessageBody = `[SYSTEM] Collaboration ${actionText}`;
        await supabaseAdmin.from('Message').insert({
          thread_id: threadId,
          sender_id: user.id,
          body: systemMessageBody,
        });

        await supabaseAdmin
          .from('MessageThread')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', threadId);
      } catch (threadErr) {
        console.error('Error inserting system message in thread:', threadErr);
      }

      // Notify brand owner using shared 'pitch_status' notification type
      await createNotification({
        userId: brand.owner_user_id,
        type: 'pitch_status',
        title: `Collaboration ${dbStatus === 'accepted' ? 'Accepted' : 'Declined'}`,
        body: `${creatorName} has ${actionText} your collaboration proposal.`,
        relatedEntityId: id,
        link: threadId
          ? `/brand/messages?thread=${threadId}`
          : `/brand?proposal=${id}#collaboration-requests`,
      });
    }

    return NextResponse.json({
      message: 'Proposal updated successfully',
      proposal: updatedRequest,
      threadId,
    });
  } catch (error) {
    console.error('PATCH /api/creator/pitches/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

