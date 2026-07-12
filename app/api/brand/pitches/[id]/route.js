import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
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
    const { data: brand, error: brandError } = await supabaseAdmin
      .from('BrandProfile')
      .select('id, brand_name')
      .eq('owner_user_id', user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    // Get CollabRequest
    const { data: collabRequest, error: collabError } = await supabaseAdmin
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
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('CollabRequest')
      .update({ status: dbStatus })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update request status' }, { status: 500 });
    }

    // Query CreatorProfile to get creator's owner_user_id
    const { data: creator, error: creatorError } = await supabaseAdmin
      .from('CreatorProfile')
      .select('owner_user_id')
      .eq('id', collabRequest.creator_id)
      .single();

    if (!creatorError && creator && creator.owner_user_id) {
      const brandName = brand.brand_name || 'A Brand';
      const actionText = dbStatus === 'accepted' ? 'accepted' : 'declined';
      
      // Insert Notification
      await supabaseAdmin.from('Notification').insert({
        user_id: creator.owner_user_id,
        type: 'collab_status',
        title: `Collaboration ${dbStatus === 'accepted' ? 'Accepted' : 'Declined'}`,
        body: `${brandName} has ${actionText} your collaboration request.`,
        is_read: false,
        related_entity_id: id
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
