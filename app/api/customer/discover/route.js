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

    const [brandsRes, productsRes, savedRes] = await Promise.all([
      supabase
        .from('BrandProfile')
        .select('id, owner_user_id, brand_name, logo_url, location, rating_avg, review_count, category, ai_tags')
        .order('created_at', { ascending: false }),
      supabase
        .from('Product')
        .select('id, brand_id, name, description, price, category, status, image_url, view_count, BrandProfile(brand_name, category)')
        .order('created_at', { ascending: false }),
      supabase
        .from('SavedBrand')
        .select('brand_id')
        .eq('customer_id', customer.id),
    ]);

    if (brandsRes.error) {
      console.error('GET /api/customer/discover brands error:', brandsRes.error);
      return NextResponse.json({ error: 'Failed to load brands' }, { status: 500 });
    }

    const brands = (brandsRes.data || []).map((row) => ({
      ...toBrandCard(row),
      ai_tags: Array.isArray(row.ai_tags) ? row.ai_tags : [],
    }));

    const products = (productsRes.data || []).map((p) => ({
      id: p.id,
      brandId: p.brand_id,
      brandName: p.BrandProfile?.brand_name || '',
      brandCategory: p.BrandProfile?.category || p.category || '',
      name: p.name || '',
      description: p.description || '',
      price: p.price !== null ? Number(p.price) : 0,
      category: p.category || p.BrandProfile?.category || '',
      status: p.status || 'in_stock',
      inStock: p.status === 'in_stock',
      image: p.image_url || null,
      view_count: p.view_count || 0,
    }));

    const savedBrandIds = (savedRes.data || []).map((r) => r.brand_id);

    return NextResponse.json({ brands, products, savedBrandIds });
  } catch (err) {
    console.error('GET /api/customer/discover error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

