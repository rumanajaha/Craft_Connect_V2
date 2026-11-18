import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { createNotification, resolveSenderName } from '@/lib/notify';
import { findOrCreateThread } from '@/lib/messages';
import { supabaseAdmin } from '@/lib/supabaseServer';

/**
 * POST /api/brand/pitches
 * Brand proposes a collaboration to a creator.
 * Inserts CollabRequest (direction: 'incoming' from creator's view, status: 'pending'),
 * creates or reuses MessageThread with a "[COLLAB_PITCH:<type>]" message,
 * and notifies the creator with a link to the thread.
 */
export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const creatorId = body?.creatorId;
    const compensationType = (body?.compensationType || body?.compensation || '').trim();
    const message = (body?.message || '').trim();

    if (!creatorId || !compensationType || !message) {
      return NextResponse.json(
        { error: 'creatorId, compensationType, and message are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseRouteClient();

    // 1. Derive BrandProfile from authenticated session
    const { data: brand, error: brandError } = await supabase
      .from('BrandProfile')
      .select('id, brand_name')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    // 2. Fetch target CreatorProfile
    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('id, owner_user_id, display_name')
      .eq('id', creatorId)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    // 3. Insert CollabRequest using session client (direction 'incoming' from creator's view)
    const { data: collabRequest, error: insertError } = await supabase
      .from('CollabRequest')
      .insert({
        brand_id: brand.id,
        creator_id: creator.id,
        compensation_type: compensationType,
        pitch_message: message,
        status: 'pending',
        direction: 'incoming',
      })
      .select()
      .single();

    if (insertError || !collabRequest) {
      console.error('POST /api/brand/pitches CollabRequest insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create collaboration proposal' }, { status: 500 });
    }

    // 4. Find or create MessageThread and insert "[COLLAB_PITCH:type]" message
    let threadId = null;
    try {
      threadId = await findOrCreateThread(user.id, creator.owner_user_id);

      const pitchMessageBody = `[COLLAB_PITCH:${compensationType}] ${message}`;
      const { error: msgError } = await supabaseAdmin.from('Message').insert({
        thread_id: threadId,
        sender_id: user.id,
        body: pitchMessageBody,
      });

      if (msgError) {
        console.error('Failed to insert brand collab pitch message:', msgError.message);
      } else {
        await supabaseAdmin
          .from('MessageThread')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', threadId);
      }
    } catch (threadErr) {
      console.error('Error setting up thread for brand proposal:', threadErr);
    }

    // 5. Notify the creator via lib/notify.js (shared type 'collab_pitch', link with real entity id)
    const brandName = brand.brand_name || (await resolveSenderName(user.id, user.email));
    await createNotification({
      userId: creator.owner_user_id,
      type: 'collab_pitch',
      title: 'New Collaboration Proposal',
      body: `${brandName} proposed a ${compensationType} collaboration.`,
      relatedEntityId: collabRequest.id,
      link: threadId
        ? `/creator/messages?thread=${threadId}`
        : `/creator?proposal=${collabRequest.id}#brand-proposals`,
    });

    return NextResponse.json(
      {
        success: true,
        pitch: collabRequest,
        threadId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/brand/pitches error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

