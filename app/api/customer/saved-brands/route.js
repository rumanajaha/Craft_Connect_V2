import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { getCustomerProfile, getCustomerStats } from '@/lib/getCustomerProfile';
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

    const [savedRes, stats] = await Promise.all([
      supabase
        .from('SavedBrand')
        .select(
          'brand_id, created_at, BrandProfile(id, owner_user_id, brand_name, logo_url, location, rating_avg, review_count, category)'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      getCustomerStats(customer.id, user.id, supabase),
    ]);

    if (savedRes.error) {
      console.error('GET /api/customer/saved-brands error:', savedRes.error);
      return NextResponse.json({ error: 'Failed to load saved brands' }, { status: 500 });
    }

    const brands = (savedRes.data || [])
      .map((row) => toBrandCard(row.BrandProfile))
      .filter(Boolean);

    return NextResponse.json({
      brands,
      savedBrandIds: brands.map((b) => b.id),
      stats,
    });
  } catch (err) {
    console.error('GET /api/customer/saved-brands error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
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

    const body = await request.json();
    const brandId = body?.brandId;
    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    const { data: brand, error: brandError } = await supabase
      .from('BrandProfile')
      .select('id')
      .eq('id', brandId)
      .maybeSingle();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const { error: insertError } = await supabase
      .from('SavedBrand')
      .insert({
        user_id: user.id,
        brand_id: brandId,
      });

    if (insertError && insertError.code !== '23505') {
      console.error('POST /api/customer/saved-brands insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save brand' }, { status: 500 });
    }

    const stats = await getCustomerStats(customer.id, user.id, supabase);
    return NextResponse.json({
      saved: true,
      brandId,
      stats,
    });
  } catch (err) {
    console.error('POST /api/customer/saved-brands error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

