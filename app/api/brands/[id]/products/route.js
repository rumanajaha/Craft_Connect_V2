import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';

    const supabase = getSupabaseRouteClient();

    const { data: brand, error: brandError } = await supabase
      .from('BrandProfile')
      .select('id')
      .eq('id', id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    let query = supabase
      .from('Product')
      .select('id, brand_id, name, description, price, category, status, image_url, created_at')
      .eq('brand_id', brand.id);

    if (featured) {
      query = query.order('created_at', { ascending: false }).limit(12);
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: products, error: productsError } = await query;

    if (productsError) {
      return NextResponse.json({ error: 'Failed to retrieve products' }, { status: 500 });
    }

    const formattedProducts = (products || []).map(p => ({
      id: p.id,
      brandId: p.brand_id,
      name: p.name || '',
      description: p.description || '',
      price: p.price !== null ? Number(p.price) : 0,
      category: p.category || '',
      status: p.status || 'in_stock',
      inStock: p.status === 'in_stock',
      image: p.image_url || ''
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error("GET brand products error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
