import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

/**
 * GET /api/brand/public/[id]
 * Public-safe read of a brand profile by its BrandProfile.id.
 * Returns only public-safe fields — never notification_prefs or internal data.
 * Also returns the brand's products and accepted collaboration history.
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
    }

    // 1. Fetch brand profile (public-safe fields only)
    const { data: brand, error: brandError } = await supabaseAdmin
      .from('BrandProfile')
      .select('id, owner_user_id, brand_name, category, location, description, ai_tags, rating_avg, review_count, trust_score, logo_url, banner_video_url, website_url')
      .eq('id', id)
      .maybeSingle();

    if (brandError) {
      console.error("GET brand/public/[id] DB error:", brandError);
      return NextResponse.json({ error: 'Failed to retrieve brand profile' }, { status: 500 });
    }

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Map to frontend model
    const profile = {
      id: brand.id,
      name: brand.brand_name || '',
      category: brand.category || '',
      location: brand.location || '',
      website: brand.website_url || '',
      logo: brand.logo_url || '',
      logoUrl: brand.logo_url || '',
      banner: brand.banner_video_url || '',
      videoUrl: brand.banner_video_url || '',
      about: brand.description || '',
      description: brand.description || '',
      tags: brand.ai_tags || [],
      rating: brand.rating_avg !== null ? Number(brand.rating_avg) : 4.9,
      reviewsCount: brand.review_count !== null ? Number(brand.review_count) : 0,
      trustScore: brand.trust_score !== null ? Number(brand.trust_score) : 100,
    };

    // 2. Fetch products for this brand
    const { data: products, error: productsError } = await supabaseAdmin
      .from('Product')
      .select('id, brand_id, name, description, price, category, status, image_url, created_at, view_count')
      .eq('brand_id', brand.id)
      .order('created_at', { ascending: false });

    const formattedProducts = (products || []).map(p => ({
      id: p.id,
      brandId: p.brand_id,
      name: p.name || '',
      description: p.description || '',
      price: p.price !== null ? Number(p.price) : 0,
      category: p.category || '',
      status: p.status || 'in_stock',
      inStock: p.status === 'in_stock',
      image: p.image_url || '',
      view_count: p.view_count || 0
    }));

    // 3. Fetch accepted collaborations for this brand
    const { data: collabs, error: collabsError } = await supabaseAdmin
      .from('CollabRequest')
      .select('id, creator_id, compensation_type, status, created_at')
      .eq('brand_id', brand.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    // Resolve creator names + avatars for collabs
    let formattedCollabs = [];
    if (collabs && collabs.length > 0) {
      const creatorIds = [...new Set(collabs.map(c => c.creator_id).filter(Boolean))];

      const { data: creators } = await supabaseAdmin
        .from('CreatorProfile')
        .select('id, owner_user_id, display_name')
        .in('id', creatorIds);

      const creatorMap = {};
      (creators || []).forEach(c => {
        creatorMap[c.id] = { name: c.display_name || 'Creator', owner_user_id: c.owner_user_id };
      });

      // Fetch avatars from CreatorProfile.avatar_url
      const creatorUserIds = (creators || []).map(c => c.owner_user_id).filter(Boolean);
      let avatarMap = {};
      if (creatorUserIds.length > 0) {
        const { data: creatorProfiles } = await supabaseAdmin
          .from('CreatorProfile')
          .select('owner_user_id, avatar_url')
          .in('owner_user_id', creatorUserIds);

        (creatorProfiles || []).forEach(p => {
          avatarMap[p.owner_user_id] = p.avatar_url;
        });
      }

      const fallbackAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';

      formattedCollabs = collabs.map(c => {
        const creatorInfo = creatorMap[c.creator_id] || {};
        return {
          id: c.id,
          creatorName: creatorInfo.name || 'Creator',
          creatorAvatar: avatarMap[creatorInfo.owner_user_id] || fallbackAvatar,
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
    console.error("GET /api/brand/public/[id] error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
