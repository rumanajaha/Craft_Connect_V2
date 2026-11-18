import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { getCustomerProfile } from '@/lib/getCustomerProfile';
import { toBrandCard } from '@/lib/mappers';

/**
 * GET /api/brand/public/[id]
 * Public-safe read of a brand profile by BrandProfile.id.
 * Returns public-safe fields via toBrandCard (incl. ownerUserId, logo: null if absent),
 * saved flag for the logged-in customer, featured products, real review count, and accepted collabs.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseRouteClient();

    // 1. Fetch public-safe brand profile fields
    const { data: brand, error: brandError } = await supabase
      .from('BrandProfile')
      .select(
        'id, owner_user_id, brand_name, category, location, description, ai_tags, rating_avg, review_count, trust_score, logo_url, banner_video_url, website_url'
      )
      .eq('id', id)
      .maybeSingle();

    if (brandError) {
      console.error('GET brand/public/[id] DB error:', brandError);
      return NextResponse.json({ error: 'Failed to retrieve brand profile' }, { status: 500 });
    }

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // 2. Fetch featured products, real review count, and saved flag for logged-in customer
    let saved = false;
    try {
      const user = await authenticate(request);
      if (user && user.role === 'CUSTOMER') {
        const customer = await getCustomerProfile(user.id, supabase);
        if (customer) {
          const { data: savedRow } = await supabase
            .from('SavedBrand')
            .select('brand_id')
            .eq('customer_id', customer.id)
            .eq('brand_id', brand.id)
            .maybeSingle();
          saved = Boolean(savedRow);
        }
      }
    } catch (_) {
      // Unauthenticated public view
    }

    const [productsRes, ratingCountRes, collabsRes] = await Promise.all([
      supabase
        .from('Product')
        .select('id, brand_id, name, description, price, category, status, image_url, created_at, view_count')
        .eq('brand_id', brand.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('Rating')
        .select('id', { count: 'exact', head: true })
        .eq('brand_id', brand.id),
      supabaseAdmin
        .from('CollabRequest')
        .select('id, creator_id, compensation_type, status, created_at')
        .eq('brand_id', brand.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false }),
    ]);

    const realReviewCount =
      !ratingCountRes.error && typeof ratingCountRes.count === 'number'
        ? ratingCountRes.count
        : (brand.review_count !== null && brand.review_count !== undefined ? Number(brand.review_count) : 0);

    const card = toBrandCard({ ...brand, review_count: realReviewCount });
    const profile = {
      ...card,
      website: brand.website_url || '',
      banner: brand.banner_video_url || null,
      videoUrl: brand.banner_video_url || null,
      about: brand.description || '',
      description: brand.description || '',
      tags: Array.isArray(brand.ai_tags) ? brand.ai_tags : [],
      trustScore: brand.trust_score !== null && brand.trust_score !== undefined ? Number(brand.trust_score) : 100,
      saved,
    };

    const formattedProducts = (productsRes.data || []).map((p) => ({
      id: p.id,
      brandId: p.brand_id,
      brandName: card.name,
      name: p.name || '',
      description: p.description || '',
      price: p.price !== null ? Number(p.price) : 0,
      category: p.category || '',
      status: p.status || 'in_stock',
      inStock: p.status === 'in_stock',
      image: p.image_url || null,
      view_count: p.view_count || 0,
    }));

    // 3. Resolve accepted collaborations (cross-user creator metadata via admin filtered by creator_ids)
    let formattedCollabs = [];
    const collabs = collabsRes.data || [];
    if (collabs.length > 0) {
      const creatorIds = [...new Set(collabs.map((c) => c.creator_id).filter(Boolean))];
      const { data: creators } = await supabaseAdmin
        .from('CreatorProfile')
        .select('id, display_name, avatar_url')
        .in('id', creatorIds);

      const creatorMap = new Map((creators || []).map((c) => [c.id, c]));

      formattedCollabs = collabs.map((c) => {
        const creator = creatorMap.get(c.creator_id);
        return {
          id: c.id,
          creatorName: creator?.display_name || 'Creator',
          creatorAvatar: creator?.avatar_url || null,
          label: `${c.compensation_type || 'collab'} collaboration`,
        };
      });
    }

    return NextResponse.json({
      profile,
      products: formattedProducts,
      collabs: formattedCollabs,
    });
  } catch (error) {
    console.error('GET /api/brand/public/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
