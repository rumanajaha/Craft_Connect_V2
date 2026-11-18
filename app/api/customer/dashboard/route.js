import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { getCustomerProfile, getCustomerStats } from '@/lib/getCustomerProfile';
import { averageVectors, matchByVector } from '@/lib/matching';
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

    const [savedRes, brandsCountRes, stats] = await Promise.all([
      supabase
        .from('SavedBrand')
        .select('brand_id, BrandProfile(id, embedding)')
        .eq('customer_id', customer.id),
      supabase
        .from('BrandProfile')
        .select('id', { count: 'exact', head: true }),
      getCustomerStats(customer.id, user.id, supabase),
    ]);

    const savedRows = savedRes.data || [];
    const savedBrandIds = savedRows.map((r) => r.brand_id);
    const savedEmbeddings = savedRows
      .map((r) => r.BrandProfile?.embedding)
      .filter(Boolean);

    // Recommendations:
    // - With saved brands: average their embeddings, call match_brands excluding already-saved brands, return matchPercent
    // - Without saved brands (or no embeddings): newest well-rated brands
    let recommendedBrands = [];
    const avgVector = savedBrandIds.length > 0 ? averageVectors(savedEmbeddings) : null;

    if (avgVector) {
      try {
        const matched = await matchByVector(avgVector, 'BrandProfile', {
          limit: 5,
          excludeIds: savedBrandIds,
        });
        recommendedBrands = matched.map((row) => ({
          ...toBrandCard(row),
          matchPercent: row.matchPercent,
        }));
      } catch (err) {
        console.warn('Dashboard match_brands fallback:', err.message);
      }
    }

    if (recommendedBrands.length === 0) {
      let query = supabase
        .from('BrandProfile')
        .select('id, owner_user_id, brand_name, logo_url, location, rating_avg, review_count, category, created_at')
        .order('rating_avg', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(5 + savedBrandIds.length);

      const { data: fallbackBrands } = await query;
      const savedSet = new Set(savedBrandIds);
      recommendedBrands = (fallbackBrands || [])
        .filter((b) => !savedSet.has(b.id))
        .slice(0, 5)
        .map(toBrandCard);
    }

    return NextResponse.json({
      customerId: customer.id,
      displayName: customer.display_name || '',
      savedBrandIds,
      totalBrands: brandsCountRes.count || 0,
      stats,
      recommendedBrands,
    });
  } catch (err) {
    console.error('GET /api/customer/dashboard error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
