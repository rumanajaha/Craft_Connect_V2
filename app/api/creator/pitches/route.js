import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { createNotification } from '@/lib/notify';
import { findOrCreateThread } from '@/lib/messages';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();

    // Get CreatorProfile
    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    // Fetch outgoing pitches for this creator joined with BrandProfile
    const { data: pitchesData, error: pitchesError } = await supabase
      .from('CollabRequest')
      .select(`
        id,
        creator_id,
        brand_id,
        compensation_type,
        pitch_message,
        status,
        direction,
        created_at,
        BrandProfile (
          id,
          brand_name,
          logo_url,
          category
        )
      `)
      .eq('creator_id', creator.id)
      .eq('direction', 'outgoing')
      .order('created_at', { ascending: false });

    if (pitchesError) {
      console.error("GET /api/creator/pitches DB error:", pitchesError);
      return NextResponse.json({ error: 'Failed to retrieve pitches' }, { status: 500 });
    }

    // Map each pitch to the shape expected by the frontend
    const formattedPitches = (pitchesData || []).map(pitch => {
      const brandInfo = pitch.BrandProfile || {};
      return {
        id: pitch.id,
        brandId: pitch.brand_id,
        brandName: brandInfo.brand_name || 'Anonymous Brand',
        brandLogo: brandInfo.logo_url || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100&auto=format&fit=crop&q=80',
        category: brandInfo.category || 'General',
        compensation: pitch.compensation_type || 'discuss',
        snippet: pitch.pitch_message || '',
        status: pitch.status || 'pending',
        date: pitch.created_at ? pitch.created_at.split('T')[0] : ''
      };
    });

    return NextResponse.json({ pitches: formattedPitches });

  } catch (error) {
    console.error("GET /api/creator/pitches error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brandId, compensation, message } = await request.json();
    if (!brandId || !compensation || !message) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = getSupabaseRouteClient();

    // Get CreatorProfile
    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('id, display_name')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    // Get BrandProfile's owner_user_id
    const { data: brand, error: brandError } = await supabase
      .from('BrandProfile')
      .select('owner_user_id')
      .eq('id', brandId)
      .maybeSingle();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    // Insert into CollabRequest with direction 'outgoing'
    const { data: collabRequest, error: collabError } = await supabase
      .from('CollabRequest')
      .insert({
        brand_id: brandId,
        creator_id: creator.id,
        compensation_type: compensation,
        pitch_message: message,
        status: 'pending',
        direction: 'outgoing'
      })
      .select()
      .maybeSingle();

    if (collabError || !collabRequest) {
      console.error("CollabRequest insert error:", collabError);
      return NextResponse.json({ error: 'Failed to create pitch' }, { status: 500 });
    }

    let threadId;
    try {
      // Find or create MessageThread between creator owner and brand owner
      threadId = await findOrCreateThread(user.id, brand.owner_user_id);

      // Insert real Message row formatted with collab pitch prefix
      const pitchMessageBody = `[COLLAB_PITCH:${compensation}] ${message}`;
      const { error: msgError } = await supabaseAdmin
        .from('Message')
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          body: pitchMessageBody
        });

      if (msgError) {
        console.error("Failed to insert collab pitch message:", msgError.message);
      } else {
        // Update the thread's last_message_at
        await supabaseAdmin
          .from('MessageThread')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', threadId);
      }
    } catch (threadErr) {
      console.error("Error setting up thread for collab request:", threadErr);
    }

    // Insert Notification for brand owner, linking to this conversation thread
    await createNotification({
      userId: brand.owner_user_id,
      type: 'collab_pitch',
      title: 'New Collaboration Pitch',
      body: `${creator.display_name} pitched a ${compensation} collaboration request.`,
      relatedEntityId: collabRequest.id,
      link: `/brand/messages?thread=${threadId || ''}`
    });

    return NextResponse.json({ success: true, pitch: collabRequest, threadId });
  } catch (error) {
    console.error("POST /api/creator/pitches error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
