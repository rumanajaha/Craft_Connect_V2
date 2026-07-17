import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { itemType, itemId } = body;

    if (!itemType || !itemId) {
      return NextResponse.json({ error: 'Missing itemType or itemId' }, { status: 400 });
    }

    if (itemType !== 'product' && itemType !== 'portfolio') {
      return NextResponse.json({ error: 'Invalid itemType. Must be product or portfolio' }, { status: 400 });
    }

    const tableName = itemType === 'product' ? 'Product' : 'PortfolioItem';

    const { error } = await supabaseAdmin.rpc('increment_view_count', {
      table_name: tableName,
      row_id: itemId
    });

    if (error) {
      console.error('Error invoking increment_view_count RPC:', error);
      return NextResponse.json({ error: 'Failed to increment view count' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/track-view error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
