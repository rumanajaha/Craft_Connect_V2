import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    const supabase = getSupabaseRouteClient();

    // Verify brand exists
    const { data: brand, error: brandError } = await supabase
      .from('BrandProfile')
      .select('id')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    let isSaved = false;

    // Try to get current user from session cookie
    const token = request.cookies.get('sb-access-token')?.value;
    if (token) {
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (!authError && user) {
        const { data: saved, error: saveError } = await supabase
          .from('SavedBrand')
          .select('id')
          .eq('user_id', user.id)
          .eq('brand_id', brandId)
          .maybeSingle();
        isSaved = !!saved;
      }
    }

    return NextResponse.json({ isSaved });
  } catch (error) {
    console.error("GET /api/brand/saved/check error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
