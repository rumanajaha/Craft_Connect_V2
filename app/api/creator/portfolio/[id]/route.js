import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

export async function PATCH(request, { params }) {
  try {
    const user = await authenticate(request);

    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const supabase = getSupabaseRouteClient();

    // Resolve creator profile ID
    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    // Retrieve target portfolio item
    const { data: existingItem, error: fetchError } = await supabase
      .from('PortfolioItem')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingItem) {
      return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 });
    }

    // Enforce ownership
    if (existingItem.creator_id !== creator.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this portfolio item' }, { status: 403 });
    }

    const body = await request.json();
    const updateData = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.brandName !== undefined) updateData.title = body.brandName;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.media_url !== undefined) updateData.media_url = body.media_url;
    if (body.image !== undefined) updateData.media_url = body.image;
    if (body.imageUrl !== undefined) updateData.media_url = body.imageUrl;

    const { data: updatedItem, error: updateError } = await supabase
      .from('PortfolioItem')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error("Creator portfolio update DB error:", updateError);
      return NextResponse.json({ error: 'Failed to update portfolio item' }, { status: 500 });
    }

    const formattedItem = {
      id: updatedItem.id,
      creatorId: updatedItem.creator_id,
      brandName: updatedItem.title || '',
      title: updatedItem.title || '',
      description: updatedItem.description || '',
      image: updatedItem.media_url || '',
      media_url: updatedItem.media_url || '',
      createdAt: updatedItem.created_at,
      view_count: updatedItem.view_count || 0
    };

    return NextResponse.json({ portfolioItem: formattedItem, item: formattedItem });

  } catch (error) {
    console.error("Creator portfolio PATCH error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticate(request);

    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const supabase = getSupabaseRouteClient();

    // Resolve creator profile ID
    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    // Retrieve target portfolio item
    const { data: existingItem, error: fetchError } = await supabase
      .from('PortfolioItem')
      .select('creator_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingItem) {
      return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 });
    }

    // Enforce ownership
    if (existingItem.creator_id !== creator.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this portfolio item' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('PortfolioItem')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error("Creator portfolio deletion error:", deleteError);
      return NextResponse.json({ error: 'Failed to delete portfolio item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Creator portfolio DELETE error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
