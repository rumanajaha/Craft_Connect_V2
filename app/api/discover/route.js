import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { getCustomerProfile, getCustomerStats } from '@/lib/getCustomerProfile';
import { toBrandCard } from '@/lib/mappers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const category = (searchParams.get('category') || '').trim();
    const location = (searchParams.get('location') || '').trim();
    const minRating = Number(searchParams.get('minRating') || 0);
    const tab = (searchParams.get('tab') || 'brands').toLowerCase() === 'products' ? 'products' : 'brands';

    const supabase = getSupabaseRouteClient();

    // Optional customer session context for saved state & server stats
    let savedBrandIds = [];
    let stats = null;
    try {
      const user = await authenticate(request);
      if (user && user.role === 'CUSTOMER') {
        const customer = await getCustomerProfile(user.id, supabase);
        if (customer) {
          const [savedRes, customerStats] = await Promise.all([
            supabase.from('SavedBrand').select('brand_id').eq('user_id', user.id),
            getCustomerStats(customer.id, user.id, supabase),
          ]);
          savedBrandIds = (savedRes.data || []).map((r) => r.brand_id);
          stats = customerStats;
        }
      }
    } catch (_) {
      // Allow public/unauthenticated discovery reads
    }

    if (tab === 'products') {
      const { data: productRows, error: prodError } = await supabase
        .from('Product')
        .select(
          'id, brand_id, name, description, price, category, status, image_url, view_count, created_at, BrandProfile(id, owner_user_id, brand_name, logo_url, location, rating_avg, review_count, category, ai_tags)'
        )
        .order('created_at', { ascending: false });

      if (prodError) {
        console.error('GET /api/discover products error:', prodError);
        return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
      }

      const products = (productRows || [])
        .filter((p) => {
          const brand = p.BrandProfile;
          const brandCard = toBrandCard(brand);
          const prodCategory = p.category || brandCard?.category || '';
          const brandTags = Array.isArray(brand?.ai_tags) ? brand.ai_tags : [];

          if (category && category !== 'All') {
            const catLower = category.toLowerCase();
            if (
              prodCategory.toLowerCase() !== catLower &&
              (brandCard?.category || '').toLowerCase() !== catLower
            ) {
              return false;
            }
          }
          if (location && location !== 'All Locations') {
            if ((brandCard?.location || '').toLowerCase() !== location.toLowerCase()) {
              return false;
            }
          }
          if (minRating > 0 && (brandCard?.rating ?? 0) < minRating) {
            return false;
          }
          if (q) {
            const matches =
              (p.name || '').toLowerCase().includes(q) ||
              (p.description || '').toLowerCase().includes(q) ||
              prodCategory.toLowerCase().includes(q) ||
              (brandCard?.name || '').toLowerCase().includes(q) ||
              brandTags.some((t) => typeof t === 'string' && t.toLowerCase().includes(q));
            if (!matches) return false;
          }
          return true;
        })
        .map((p) => {
          const brandCard = toBrandCard(p.BrandProfile);
          return {
            id: p.id,
            brandId: p.brand_id,
            brand: brandCard,
            brandName: brandCard?.name || '',
            name: p.name || '',
            description: p.description || '',
            price: p.price !== null ? Number(p.price) : 0,
            category: p.category || brandCard?.category || '',
            status: p.status || 'in_stock',
            inStock: p.status === 'in_stock',
            image: p.image_url || null,
            view_count: p.view_count || 0,
          };
        });

      return NextResponse.json({
        tab: 'products',
        products,
        savedBrandIds,
        stats,
      });
    }

    // Default: tab=brands
    const { data: brandRows, error: brandError } = await supabase
      .from('BrandProfile')
      .select(
        'id, owner_user_id, brand_name, logo_url, location, rating_avg, review_count, category, ai_tags, created_at'
      )
      .order('created_at', { ascending: false });

    if (brandError) {
      console.error('GET /api/discover brands error:', brandError);
      return NextResponse.json({ error: 'Failed to load brands' }, { status: 500 });
    }

    const savedSet = new Set(savedBrandIds);
    const brands = (brandRows || [])
      .filter((row) => {
        const card = toBrandCard(row);
        const tags = Array.isArray(row.ai_tags) ? row.ai_tags : [];

        if (category && category !== 'All' && card.category.toLowerCase() !== category.toLowerCase()) {
          return false;
        }
        if (location && location !== 'All Locations' && card.location.toLowerCase() !== location.toLowerCase()) {
          return false;
        }
        if (minRating > 0 && card.rating < minRating) {
          return false;
        }
        if (q) {
          const matches =
            card.name.toLowerCase().includes(q) ||
            card.category.toLowerCase().includes(q) ||
            card.location.toLowerCase().includes(q) ||
            tags.some((t) => typeof t === 'string' && t.toLowerCase().includes(q));
          if (!matches) return false;
        }
        return true;
      })
      .map((row) => ({
        ...toBrandCard(row),
        isSaved: savedSet.has(row.id),
      }));

    return NextResponse.json({
      tab: 'brands',
      brands,
      savedBrandIds,
      stats,
    });
  } catch (err) {
    console.error('GET /api/discover error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

