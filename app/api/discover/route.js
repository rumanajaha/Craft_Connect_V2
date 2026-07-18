import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

export async function GET(request) {
  try {
    let user;
    try {
      user = await authenticate(request);
    } catch (authError) {
      console.error("Discover GET auth error:", authError.message || authError);
      return NextResponse.json({ error: 'Authentication failed', details: authError.message || String(authError) }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || 'All';
    const location = searchParams.get('location') || 'All Locations';
    const minRating = Number(searchParams.get('minRating') || '0');
    const tab = searchParams.get('tab') || 'brands';

    const supabase = getSupabaseRouteClient();

    if (tab === 'brands') {
      let queryBuilder = supabase
        .from('BrandProfile')
        .select('id, brand_name, logo_url, category, location, rating_avg, review_count');

      if (category && category !== 'All') {
        queryBuilder = queryBuilder.eq('category', category);
      }
      if (location && location !== 'All Locations') {
        queryBuilder = queryBuilder.eq('location', location);
      }
      if (minRating > 0) {
        queryBuilder = queryBuilder.gte('rating_avg', minRating);
      }
      if (q) {
        queryBuilder = queryBuilder.or(`brand_name.ilike.%${q}%,category.ilike.%${q}%,location.ilike.%${q}%`);
      }

      const { data: brands, error } = await queryBuilder;

      if (error) {
        console.error("GET discover brands error:", error.message);
        return NextResponse.json({ error: 'Failed to retrieve brands', details: error.message }, { status: 500 });
      }

      const formattedBrands = (brands || []).map(b => ({
        id: b.id,
        name: b.brand_name || 'Unknown Brand',
        logo: b.logo_url || null,
        category: b.category || 'General',
        location: b.location || '',
        rating: b.rating_avg != null ? Number(b.rating_avg) : 0,
        reviewsCount: b.review_count != null ? Number(b.review_count) : 0,
      }));

      // Fetch unique locations
      const { data: locData } = await supabase
        .from('BrandProfile')
        .select('location');
      const uniqueLocations = Array.from(new Set((locData || []).map(b => b.location).filter(Boolean)));
      const locationsList = ['All Locations', ...uniqueLocations];

      return NextResponse.json({ brands: formattedBrands, locations: locationsList });

    } else {
      // Fetch unique locations
      const { data: locData } = await supabase
        .from('BrandProfile')
        .select('location');
      const uniqueLocations = Array.from(new Set((locData || []).map(b => b.location).filter(Boolean)));
      const locationsList = ['All Locations', ...uniqueLocations];
      // tab === 'products'
      let queryBuilder = supabase
        .from('Product')
        .select(`
          id,
          brand_id,
          name,
          description,
          price,
          category,
          status,
          buy_link,
          image_url,
          view_count,
          BrandProfile:brand_id (
            id,
            brand_name,
            logo_url,
            category,
            location,
            rating_avg,
            review_count
          )
        `);

      if (category && category !== 'All') {
        queryBuilder = queryBuilder.eq('category', category);
      }

      if (q) {
        queryBuilder = queryBuilder.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
      }

      const { data: products, error } = await queryBuilder;

      if (error) {
        console.error("GET discover products error:", error.message);
        return NextResponse.json({ error: 'Failed to retrieve products', details: error.message }, { status: 500 });
      }

      // Filter by joined brand's properties in JS to handle RLS and client-side joins properly
      let filteredProducts = products || [];

      if (location && location !== 'All Locations') {
        filteredProducts = filteredProducts.filter(p => p.BrandProfile?.location === location);
      }

      if (minRating > 0) {
        filteredProducts = filteredProducts.filter(p => (p.BrandProfile?.rating_avg || 0) >= minRating);
      }

      // Map to output format
      const formattedProducts = filteredProducts.map(p => ({
        id: p.id,
        brandId: p.brand_id,
        brandName: p.BrandProfile?.brand_name || 'Unknown Brand',
        brandLogo: p.BrandProfile?.logo_url || '/placeholder-brand-logo.png',
        name: p.name || '',
        description: p.description || '',
        price: p.price !== null ? Number(p.price) : 0,
        category: p.category || p.BrandProfile?.category || '',
        status: p.status || 'in_stock',
        inStock: p.status === 'in_stock',
        buyLink: p.buy_link || '',
        image: p.image_url || '',
        view_count: p.view_count || 0
      }));

      return NextResponse.json({ products: formattedProducts, locations: locationsList });
    }

  } catch (err) {
    console.error("GET discover route error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
