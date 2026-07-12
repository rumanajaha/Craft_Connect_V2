import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(request) {
  try {
    const user = await authenticate(request);

    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: brand, error: brandError } = await supabaseAdmin
      .from('BrandProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    // Retrieve counts for each tool from the AIGeneration table
    const { data: usageData, error: usageError } = await supabaseAdmin
      .from('AIGeneration')
      .select('tool_name')
      .eq('brand_id', brand.id);

    if (usageError) {
      return NextResponse.json({ error: 'Failed to retrieve AI usage' }, { status: 500 });
    }

    const counts = {
      'banner-video': 0,
      'brand-story': 0,
      'recommendation-tags': 0
    };

    (usageData || []).forEach(row => {
      if (counts[row.tool_name] !== undefined) {
        counts[row.tool_name]++;
      }
    });

    return NextResponse.json({ usage: counts });

  } catch (error) {
    console.error("AI usage fetch error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
