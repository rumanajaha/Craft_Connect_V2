import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

export async function GET(request) {
  try {
    const user = await authenticate(request);

    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();
    const { data: brand, error: brandError } = await supabase
      .from('BrandProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    // Get first day of current month to fetch rolling monthly quotas
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Retrieve counts for each tool from the AIGeneration table for the current month
    const { data: usageData, error: usageError } = await supabase
      .from('AIGeneration')
      .select('tool_name')
      .eq('brand_id', brand.id)
      .gte('created_at', startOfMonth);

    if (usageError) {
      return NextResponse.json({ error: 'Failed to retrieve AI usage' }, { status: 500 });
    }

    const counts = {
      'banner-video': 0,
      'brand-story': 0,
      'recommendation-tags': 0,
      'seo-description': 0,
      'creator-match': 0,
      'trending-feed': 0,
      'brand-match': 0,
      'content-ideas': 0,
    };

    const aliasToUiKey = {
      'brand_story': 'brand-story',
      'brand_tags': 'recommendation-tags',
    };

    (usageData || []).forEach(row => {
      const key = aliasToUiKey[row.tool_name] || row.tool_name;
      if (counts[key] !== undefined) {
        counts[key]++;
      }
    });

    return NextResponse.json({ usage: counts });

  } catch (error) {
    console.error("AI usage fetch error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
