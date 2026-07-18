import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { getCustomerStats } from '@/lib/customerStats';

export async function GET(request) {
  try {
    let user;
    try {
      user = await authenticate(request);
    } catch (authError) {
      console.error("GET Customer Dashboard auth error:", authError.message || authError);
      return NextResponse.json({ error: 'Authentication failed', details: authError.message || String(authError) }, { status: 401 });
    }

    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();

    // 1. Get stats via shared helper
    const stats = await getCustomerStats(user.id);

    // 2. Count total brands available
    const { count: brands_available_count } = await supabase
      .from('BrandProfile')
      .select('*', { count: 'exact', head: true });

    // 3. Recommended Brands logic weighted toward customer's SavedBrand categories
    // Step 3a. Resolve CustomerProfile.id, then fetch saved brand categories (admin to bypass RLS)
    const { data: cpRow } = await supabaseAdmin
      .from('CustomerProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .maybeSingle();
    const cpId = cpRow?.id;

    const { data: savedBrands } = cpId ? await supabaseAdmin
      .from('SavedBrand')
      .select('brand_id, BrandProfile:brand_id ( category )')
      .eq('customer_id', cpId) : { data: [] };
    
    const savedCategories = (savedBrands || [])
      .map(item => item.BrandProfile?.category)
      .filter(Boolean);

    // Step 3b. Retrieve list of active BrandProfiles
    const { data: brands, error: brandsError } = await supabase
      .from('BrandProfile')
      .select('id, brand_name, logo_url, category, location, rating_avg, review_count')
      .limit(50);

    if (brandsError) {
      console.error("GET dashboard brands error:", brandsError.message);
      return NextResponse.json({ error: 'Failed to retrieve recommended brands', details: brandsError.message }, { status: 500 });
    }

    let recommended = brands || [];
    if (savedCategories.length > 0) {
      // Sort in JS: if brand's category matches any saved category, sort first
      recommended = [...recommended].sort((a, b) => {
        const aMatch = savedCategories.includes(a.category) ? 1 : 0;
        const bMatch = savedCategories.includes(b.category) ? 1 : 0;
        return bMatch - aMatch;
      });
    }

    const formattedRecommended = recommended.slice(0, 5).map(b => ({
      id: b.id,
      name: b.brand_name || 'Unknown Brand',
      logo: b.logo_url || null,
      category: b.category || 'General',
      location: b.location || '',
      rating: b.rating_avg != null ? Number(b.rating_avg) : 0,
      reviewsCount: b.review_count != null ? Number(b.review_count) : 0,
    }));

    return NextResponse.json({
      stats: {
        saved_brands_count: stats.saved_brands_count,
        active_requests_count: stats.active_requests_count,
        total_messages_count: stats.total_messages_count,
        brands_available_count: brands_available_count || 0
      },
      recommended: formattedRecommended
    });

  } catch (err) {
    console.error("GET Customer Dashboard error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
