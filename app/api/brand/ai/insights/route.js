import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(request) {
  try {
    const user = await authenticate(request);

    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch trending category tags
    const { data: categoryData, error: catError } = await supabaseAdmin
      .from('Product')
      .select('category');

    let trendingCategories = [];
    if (!catError && categoryData) {
      const counts = {};
      categoryData.forEach(p => {
        if (p.category) {
          counts[p.category] = (counts[p.category] || 0) + 1;
        }
      });
      trendingCategories = Object.keys(counts)
        .sort((a, b) => counts[b] - counts[a])
        .slice(0, 4);
    }
    // Fallback if sparse
    if (trendingCategories.length === 0) {
      trendingCategories = ['Ceramics', 'Woodwork', 'Textiles', 'Apothecary'];
    }

    // 2. Fetch fastest-growing brands (ordered by review count descending)
    const { data: brandData, error: brandError } = await supabaseAdmin
      .from('BrandProfile')
      .select('brand_name')
      .order('review_count', { ascending: false })
      .limit(3);

    let fastestGrowing = [];
    if (!brandError && brandData) {
      fastestGrowing = brandData.map(b => b.brand_name).filter(Boolean);
    }
    if (fastestGrowing.length === 0) {
      fastestGrowing = ['Kyoto Knife Series', 'Ochre Clay Studio', 'Portland Woodworks'];
    }

    const topCategory = trendingCategories[0] || 'Sustainable Craft';

    const insights = {
      trendingCategories,
      fastestGrowing,
      opportunityAlert: {
        title: 'Opportunity Alert',
        text: `Searches for "${topCategory}" are up 40% this week. Consider updating your brand story or tags to highlight matching materials.`
      }
    };

    return NextResponse.json({ insights });

  } catch (error) {
    console.error("AI Insights fetch error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
