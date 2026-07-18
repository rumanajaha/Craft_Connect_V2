import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get customer's CustomerProfile.id via admin (bypass RLS)
    const { data: customerProfile, error: profileError } = await supabaseAdmin
      .from('CustomerProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .single();

    if (profileError || !customerProfile) {
      console.error("Failed to retrieve CustomerProfile ID in GET saved-brands:", profileError?.message);
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    // Query SavedBrand joined with BrandProfile using customer_id (admin to bypass RLS)
    const { data, error } = await supabaseAdmin
      .from('SavedBrand')
      .select(`
        created_at,
        brand_id,
        BrandProfile:brand_id (
          id,
          brand_name,
          logo_url,
          category,
          location,
          rating_avg,
          review_count
        )
      `)
      .eq('customer_id', customerProfile.id);

    if (error) {
      console.error("GET saved-brands error:", error.message);
      return NextResponse.json({ error: 'Failed to retrieve saved brands', details: error.message }, { status: 500 });
    }

    const savedBrands = (data || [])
      .filter(item => item.BrandProfile) // ensure joined profile exists
      .map(item => {
        const p = item.BrandProfile;
        return {
          savedAt: item.created_at,
          // Map DB column names → BrandCard prop names
          id: p.id,
          name: p.brand_name || '',
          logo: p.logo_url || null,
          category: p.category || '',
          location: p.location || '',
          rating: p.rating_avg != null ? Number(p.rating_avg) : 0,
          reviewsCount: p.review_count != null ? Number(p.review_count) : 0,
        };
      });

    return NextResponse.json({ savedBrands });
  } catch (err) {
    console.error("GET saved-brands wrapper error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { brandId } = body;

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    const supabase = getSupabaseRouteClient();

    // 1. Get customer's CustomerProfile.id
    const { data: customerProfile, error: profileError } = await supabase
      .from('CustomerProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .single();

    if (profileError || !customerProfile) {
      console.error("Failed to retrieve CustomerProfile ID in POST saved-brands:", profileError?.message);
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    // Verify brand exists
    const { data: brand, error: brandError } = await supabase
      .from('BrandProfile')
      .select('id')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Insert saved brand using customer_id via supabaseAdmin to bypass RLS failures
    const { data: saved, error: saveError } = await supabaseAdmin
      .from('SavedBrand')
      .insert({
        customer_id: customerProfile.id,
        brand_id: brandId,
      })
      .select('created_at')
      .maybeSingle();

    if (saveError) {
      if (saveError.code === '23505') {
        return NextResponse.json({ saved: true, isSaved: true });
      }
      console.error("Save brand DB error:", saveError.message);
      return NextResponse.json({ error: 'Failed to save brand', details: saveError.message }, { status: 500 });
    }

    return NextResponse.json({ saved: true, isSaved: true });
  } catch (err) {
    console.error("POST saved-brands error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    const supabase = getSupabaseRouteClient();

    // Get customer's CustomerProfile.id
    const { data: customerProfile, error: profileError } = await supabase
      .from('CustomerProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .single();

    if (profileError || !customerProfile) {
      console.error("Failed to retrieve CustomerProfile ID in DELETE saved-brands:", profileError?.message);
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    // Delete using supabaseAdmin to bypass RLS constraint failures
    const { error: deleteError } = await supabaseAdmin
      .from('SavedBrand')
      .delete()
      .eq('customer_id', customerProfile.id)
      .eq('brand_id', brandId);

    if (deleteError) {
      console.error("Unsave brand DB error:", deleteError.message);
      return NextResponse.json({ error: 'Failed to unsave brand', details: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ saved: false, isSaved: false });
  } catch (err) {
    console.error("DELETE saved-brands error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
