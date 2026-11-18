import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { getCustomerProfile } from '@/lib/getCustomerProfile';
import { matchByEmbedding } from '@/lib/matching';
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

    const { searchParams } = new URL(request.url);
    const customQuery = searchParams.get('q')?.trim();
    const limit = Math.min(20, Math.max(1, Number(searchParams.get('limit')) || 5));

    let queryText = customQuery || '';

    if (!queryText) {
      // Build taste profile from saved brands using session-scoped client (RLS)
      const { data: savedRows } = await supabase
        .from('SavedBrand')
        .select('brand_id, BrandProfile (brand_name, category, ai_tags)')
        .eq('customer_id', customer.id)
        .limit(10);

      if (savedRows && savedRows.length > 0) {
        const parts = savedRows
          .map((row) => {
            const b = row.BrandProfile;
            if (!b) return '';
            const tags = Array.isArray(b.ai_tags) ? b.ai_tags.join(', ') : '';
            return [b.category, tags].filter(Boolean).join(', ');
          })
          .filter(Boolean);
        if (parts.length > 0) {
          queryText = `Handcrafted brands matching: ${parts.join('; ')}`;
        }
      }
    }

    if (!queryText) {
      queryText = 'handcrafted ceramics textiles woodwork slow living sustainable artisan home decor';
    }

    try {
      const matched = await matchByEmbedding(queryText, 'BrandProfile', { limit });
      const recommendations = matched.map((row) => ({
        ...toBrandCard(row),
        matchPercent: row.matchPercent,
      }));
      return NextResponse.json({ recommendations });
    } catch (matchErr) {
      // Graceful fallback to top-rated BrandProfiles via session client if Gemini is temporarily unavailable
      console.warn('Customer recommendations embedding fallback:', matchErr.message);
      const { data: fallbackBrands } = await supabase
        .from('BrandProfile')
        .select('id, owner_user_id, brand_name, logo_url, location, rating_avg, review_count, category')
        .order('rating_avg', { ascending: false })
        .limit(limit);

      return NextResponse.json({
        recommendations: (fallbackBrands || []).map(toBrandCard),
      });
    }
  } catch (error) {
    console.error('GET /api/customer/recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to load recommendations' },
      { status: 500 }
    );
  }
}
