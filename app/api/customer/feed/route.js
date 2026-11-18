import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { getCustomerProfile } from '@/lib/getCustomerProfile';
import { averageVectors } from '@/lib/matching';
import { rankFeedByVector } from '@/lib/feedHelpers';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const offset = (page - 1) * limit;

    const supabase = getSupabaseRouteClient();
    const customer = await getCustomerProfile(user.id, supabase);
    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    // 1. Fetch customer's saved brand embeddings & tags + real Product & PortfolioItem rows
    const [savedRes, productsRes, portfolioRes] = await Promise.all([
      supabase
        .from('SavedBrand')
        .select('brand_id, BrandProfile(embedding, ai_tags, category)')
        .eq('user_id', user.id),
      supabase
        .from('Product')
        .select('*, BrandProfile(brand_name, logo_url, category, ai_tags), embedding')
        .eq('status', 'in_stock'),
      supabase
        .from('PortfolioItem')
        .select('*, CreatorProfile(display_name, avatar_url, niches), embedding'),
    ]);

    if (productsRes.error) {
      console.error('GET /api/customer/feed Products error:', productsRes.error);
    }
    if (portfolioRes.error) {
      console.error('GET /api/customer/feed PortfolioItems error:', portfolioRes.error);
    }

    const savedRows = savedRes.data || [];
    const savedEmbeddings = savedRows
      .map((r) => r.BrandProfile?.embedding)
      .filter(Boolean);
    const savedTags = savedRows.flatMap((r) => [
      ...(Array.isArray(r.BrandProfile?.ai_tags) ? r.BrandProfile.ai_tags : []),
      ...(r.BrandProfile?.category ? [r.BrandProfile.category] : []),
    ]);
    const avgViewerVec = savedRows.length > 0 ? averageVectors(savedEmbeddings) : null;

    // 2. Merge Product + PortfolioItem in the exact SharedFeedPage card shape
    const merged = [];

    (productsRes.data || []).forEach((p) => {
      merged.push({
        id: p.id,
        type: 'product',
        contentType: 'product',
        productId: p.id,
        brandId: p.brand_id,
        name: p.name || '',
        price: p.price !== null ? Number(p.price) : 0,
        image: p.image_url || '',
        brandName: p.BrandProfile?.brand_name || '',
        brandLogo: p.BrandProfile?.logo_url || null,
        category: p.BrandProfile?.category || p.category || '',
        ai_tags: p.BrandProfile?.ai_tags || [],
        created_at: p.created_at,
        views: p.view_count || 0,
        saves: 0,
        rating: 4.9,
        description: p.description || '',
        buyLink: p.buy_link || '',
        _embedding: p.embedding || null,
      });
    });

    (portfolioRes.data || []).forEach((pf) => {
      merged.push({
        id: pf.id,
        type: 'creator_content',
        contentType: 'portfolio',
        creatorId: pf.creator_id,
        creatorName: pf.CreatorProfile?.display_name || '',
        creatorAvatar: pf.CreatorProfile?.avatar_url || null,
        portfolioImage: pf.media_url || '',
        caption: pf.description || '',
        description: pf.description || '',
        ai_tags: pf.CreatorProfile?.niches || [],
        created_at: pf.created_at,
        views: pf.view_count || 0,
        saves: 0,
        rating: 4.9,
        _embedding: pf.embedding || null,
      });
    });

    // 3. Rank by similarity to saved-brand centroid embedding (or recency + engagement when no saves)
    const ranked = rankFeedByVector(merged, avgViewerVec, savedTags);

    const paginated = ranked.slice(offset, offset + limit);
    const hasMore = offset + limit < ranked.length;

    return NextResponse.json({ items: paginated, hasMore });
  } catch (err) {
    console.error('GET /api/customer/feed error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

