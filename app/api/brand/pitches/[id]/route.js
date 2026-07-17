import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { createNotification } from '@/lib/notify';
import { findOrCreateThread } from '@/lib/messages';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function PATCH(request, { params }) {
  try {
    const user = await authenticate(request);

    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!status || !['accepted', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get BrandProfile
    const supabase = getSupabaseRouteClient();
    const { data: brand, error: brandError } = await supabase
      .from('BrandProfile')
      .select('id, brand_name')
      .eq('owner_user_id', user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    // Get CollabRequest
    const { data: collabRequest, error: collabError } = await supabase
      .from('CollabRequest')
      .select('*')
      .eq('id', id)
      .single();

    if (collabError || !collabRequest || collabRequest.brand_id !== brand.id) {
      return NextResponse.json({ error: 'Pitch not found' }, { status: 404 });
    }

    // Map status 'rejected' -> 'declined'
    let dbStatus = status;
    if (status === 'rejected') {
      dbStatus = 'declined';
    }

    // Update CollabRequest
    const { data: updatedRequest, error: updateError } = await supabase
      .from('CollabRequest')
      .update({ status: dbStatus })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update request status' }, { status: 500 });
    }

    // Query CreatorProfile to get creator's owner_user_id
    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('owner_user_id')
      .eq('id', collabRequest.creator_id)
      .single();

    if (!creatorError && creator && creator.owner_user_id) {
      const brandName = brand.brand_name || 'A Brand';
      const actionText = dbStatus === 'accepted' ? 'accepted' : 'declined';
      
      // Insert SYSTEM style message in the thread
      try {
        const threadId = await findOrCreateThread(creator.owner_user_id, user.id);
        const systemMessageBody = `[SYSTEM] Collaboration ${dbStatus === 'accepted' ? 'accepted' : 'declined'}`;
        await supabaseAdmin
          .from('Message')
          .insert({
            thread_id: threadId,
            sender_id: user.id,
            body: systemMessageBody
          });

        // Update the thread's last_message_at
        await supabaseAdmin
          .from('MessageThread')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', threadId);
      } catch (threadErr) {
        console.error("Error setting up system message in conversation thread:", threadErr);
      }

      // TODO: Once the Creator backend and campaign views are fully implemented, this notification link and routing
      // should target the creator's specific pitch detail view or campaign page (currently fallback to creator dashboard).
      //
      // TODO: For the reverse flow (when a brand proposes a collab to a creator, and the creator accepts/declines),
      // we will need to add a notification insert here targeting the brand owner (type: "pitch_status", link: "/brand#collaboration-requests").
      await createNotification({
        userId: creator.owner_user_id,
        type: 'pitch_response',
        title: `Collaboration ${dbStatus === 'accepted' ? 'Accepted' : 'Declined'}`,
        body: `${brandName} has ${actionText} your collaboration request.`,
        relatedEntityId: id,
        link: '/creator#my-pitches'
      });
    }

    return NextResponse.json({
      message: 'Pitch updated successfully',
      pitch: updatedRequest
    });

  } catch (error) {
    console.error("Pitch update error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
