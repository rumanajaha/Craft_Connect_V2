import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

export async function GET(request) {
  try {
    const user = await authenticate(request);

    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Fetch portfolio items ordered by created_at desc
    const { data: items, error: itemsError } = await supabase
      .from('PortfolioItem')
      .select('*')
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error("GET PortfolioItem DB error:", itemsError);
      return NextResponse.json({ error: 'Failed to retrieve portfolio items' }, { status: 500 });
    }

    // Map database columns to the UI keys:
    // title -> brandName
    // media_url -> image
    const formattedItems = (items || []).map(item => ({
      id: item.id,
      creatorId: item.creator_id,
      brandName: item.title || '',
      title: item.title || '',
      description: item.description || '',
      image: item.media_url || '',
      media_url: item.media_url || '',
      createdAt: item.created_at
    }));

    return NextResponse.json({ portfolio: formattedItems });

  } catch (error) {
    console.error("Creator portfolio GET error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await authenticate(request);

    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();

    // Resolve creator profile ID (ignoring any client-supplied ID for security)
    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, brandName, description, media_url, image, imageUrl } = body;

    const finalTitle = title || brandName;
    const finalMediaUrl = media_url || image || imageUrl || '';

    if (!finalTitle) {
      return NextResponse.json({ error: 'Title/Brand Name is required' }, { status: 400 });
    }

    const { data: newItem, error: insertError } = await supabase
      .from('PortfolioItem')
      .insert({
        creator_id: creator.id,
        title: finalTitle,
        description: description || '',
        media_url: finalMediaUrl
      })
      .select()
      .single();

    if (insertError) {
      console.error("Creator portfolio insert DB error:", insertError);
      return NextResponse.json({ error: 'Failed to create portfolio item' }, { status: 500 });
    }

    const formattedItem = {
      id: newItem.id,
      creatorId: newItem.creator_id,
      brandName: newItem.title || '',
      title: newItem.title || '',
      description: newItem.description || '',
      image: newItem.media_url || '',
      media_url: newItem.media_url || '',
      createdAt: newItem.created_at
    };

    return NextResponse.json({ portfolioItem: formattedItem, item: formattedItem });

  } catch (error) {
    console.error("Creator portfolio POST error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
