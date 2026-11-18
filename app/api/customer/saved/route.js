import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { getCustomerProfile } from '@/lib/getCustomerProfile';
import { toBrandCard } from '@/lib/mappers';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();
    const customer = await getCustomerProfile(user.id, supabase);
    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('SavedBrand')
      .select('brand_id, created_at, BrandProfile(id, owner_user_id, brand_name, logo_url, location, rating_avg, review_count, category)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET /api/customer/saved error:', error);
      return NextResponse.json({ error: 'Failed to load saved brands' }, { status: 500 });
    }

    const brands = (data || [])
      .map((row) => toBrandCard(row.BrandProfile))
      .filter(Boolean);

    return NextResponse.json({ brands });
  } catch (err) {
    console.error('GET /api/customer/saved error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

