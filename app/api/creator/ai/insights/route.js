import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();

    // 1. Trending Categories: Aggregate most-used ai_tags across all BrandProfile rows
    const { data: brandsData, error: brandsError } = await supabase
      .from('BrandProfile')
      .select('ai_tags');

    let categoryCounts = {};
    if (!brandsError && brandsData) {
      brandsData.forEach(brand => {
        const tags = brand.ai_tags || [];
        tags.forEach(tag => {
          const trimmed = tag.trim().toLowerCase();
          if (trimmed) {
            categoryCounts[trimmed] = (categoryCounts[trimmed] || 0) + 1;
          }
        });
      });
    }

    // Format top 5 trending categories
    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0].charAt(0).toUpperCase() + entry[0].slice(1))
      .slice(0, 5);

    const trendingCategories = sortedCategories.length > 0
      ? sortedCategories
      : ["Ceramics", "Minimalist", "Slow Living", "Sustainable", "Eco-friendly"];

    // 2. Top Brands: Fetch brands and count accepted collaborations or products to calculate engagement delta
    const { data: topBrandsData } = await supabase
      .from('BrandProfile')
      .select(`
        id,
        brand_name,
        Product (id)
      `)
      .limit(10);

    let brandsList = [];
    if (topBrandsData) {
      brandsList = topBrandsData.map(b => ({
        name: b.brand_name || 'Anonymous Brand',
        productCount: b.Product ? b.Product.length : 0
      }));
    }

    // Sort by product activity/count
    const sortedBrands = brandsList
      .sort((a, b) => b.productCount - a.productCount)
      .map(b => b.name)
      .slice(0, 3);

    const topBrands = sortedBrands.length > 0
      ? sortedBrands
      : ["Ochre Clay Studio", "Soren Objects", "Gaea Weaves"];

    return NextResponse.json({
      trendingCategories,
      topBrands
    });

  } catch (error) {
    console.error("GET /api/creator/ai/insights error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
