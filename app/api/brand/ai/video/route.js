import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request) {
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

    // Check quota first
    const { count, error: countError } = await supabaseAdmin
      .from('AIGeneration')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brand.id)
      .eq('tool_name', 'banner-video');

    if (countError) {
      return NextResponse.json({ error: 'Failed to verify quota' }, { status: 500 });
    }

    if (count >= 3) {
      return NextResponse.json({
        error: 'Quota exceeded',
        message: 'You have used all of your 3 free generations for this tool. Please upgrade to Pro to unlock unlimited usage.'
      }, { status: 429 });
    }

    // TODO: Integrate with a video generation API (e.g. Runway Gen-2, Sora, Luma Dream Machine)
    // For now, return a 501 error indicating the integration is pending, as faking success is prohibited.
    return NextResponse.json({
      error: 'Not Implemented',
      message: 'AI Video Generation API is not configured yet. (TODO: Set up a video generation provider like Runway or Luma to enable this feature.)'
    }, { status: 501 });

  } catch (error) {
    console.error("AI Video generation error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
