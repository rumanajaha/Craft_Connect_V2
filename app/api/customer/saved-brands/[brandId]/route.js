import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

export async function DELETE(request, { params }) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { brandId } = resolvedParams || {};
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
      console.error("Failed to retrieve CustomerProfile ID in DELETE saved-brands/[brandId]:", profileError?.message);
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    // Delete using supabaseAdmin to bypass RLS constraint errors
    const { error: deleteError } = await supabaseAdmin
      .from('SavedBrand')
      .delete()
      .eq('customer_id', customerProfile.id)
      .eq('brand_id', brandId);

    if (deleteError) {
      console.error("DELETE saved-brand [id] error:", deleteError.message);
      return NextResponse.json({ error: 'Failed to unsave brand', details: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ saved: false, isSaved: false });
  } catch (err) {
    console.error("DELETE saved-brands/:id error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
