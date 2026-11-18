import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

export async function GET() {
  try {
    const supabase = getSupabaseRouteClient();
    const { data, error } = await supabase
      .from('BrandProfile')
      .select('location')
      .not('location', 'is', null);

    if (error) {
      console.error('GET /api/discover/locations error:', error);
      return NextResponse.json({ error: 'Failed to load locations' }, { status: 500 });
    }

    const distinct = Array.from(
      new Set(
        (data || [])
          .map((row) => (typeof row.location === 'string' ? row.location.trim() : ''))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ locations: distinct });
  } catch (err) {
    console.error('GET /api/discover/locations error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

