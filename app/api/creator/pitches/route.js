import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

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

    // Insert into CollabRequest
    const { data: collabRequest, error: collabError } = await supabase
      .from('CollabRequest')
      .insert({
        brand_id: brandId,
        creator_id: creator.id,
        compensation_type: compensation,
        pitch_message: message,
        status: 'pending',
        direction: 'incoming'
      })
      .select()
      .maybeSingle();

    if (collabError || !collabRequest) {
      console.error("CollabRequest insert error:", collabError);
      return NextResponse.json({ error: 'Failed to create pitch' }, { status: 500 });
    }

    // Insert Notification for brand owner
    await supabase.from('Notification').insert({
      user_id: brand.owner_user_id,
      type: 'collab_pitch',
      title: 'New Collaboration Pitch',
      body: `${creator.display_name} pitched a ${compensation} collaboration request.`,
      is_read: false,
      related_entity_id: collabRequest.id,
      link: '/brand#collaboration-requests'
    });

    return NextResponse.json({ success: true, pitch: collabRequest });
  } catch (error) {
    console.error("POST /api/creator/pitches error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
