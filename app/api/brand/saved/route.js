import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request) {
  try {
    const user = await authenticate(request);

    if (!user || (user.role !== 'CUSTOMER' && user.role !== 'CREATOR')) {
      return NextResponse.json({ error: 'Unauthorized: Only customers and creators can save brands' }, { status: 401 });
    }

    const body = await request.json();
    const { brandId } = body;

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

    // Insert saved brand (unique constraint on user_id + brand_id prevents duplicates)
    const { data: saved, error: saveError } = await supabase
      .from('SavedBrand')
      .insert({
        user_id: user.id,
        brand_id: brandId,
      })
      .select('id')
      .single();

    if (saveError) {
      // If duplicate, treat as success (already saved)
      if (saveError.code === '23505') {
        return NextResponse.json({ saved: true, isSaved: true });
      }
      console.error("Save brand error:", saveError);
      return NextResponse.json({ error: 'Failed to save brand' }, { status: 500 });
    }

    return NextResponse.json({ saved: true, isSaved: true, id: saved.id });
  } catch (error) {
    console.error("POST /api/brand/saved error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await authenticate(request);

    if (!user || (user.role !== 'CUSTOMER' && user.role !== 'CREATOR')) {
      return NextResponse.json({ error: 'Unauthorized: Only customers and creators can unsave brands' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    const supabase = getSupabaseRouteClient();

    const { error: deleteError } = await supabase
      .from('SavedBrand')
      .delete()
      .eq('user_id', user.id)
      .eq('brand_id', brandId);

    if (deleteError) {
      console.error("Unsave brand error:", deleteError);
      return NextResponse.json({ error: 'Failed to unsave brand' }, { status: 500 });
    }

    return NextResponse.json({ saved: false, isSaved: false });
  } catch (error) {
    console.error("DELETE /api/brand/saved error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
