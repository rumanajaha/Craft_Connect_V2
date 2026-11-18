import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { getCustomerProfile, getCustomerStats } from '@/lib/getCustomerProfile';

export async function DELETE(request, { params }) {
  try {
    const { brandId } = await params;

    const user = await authenticate(request);
    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    const supabase = getSupabaseRouteClient();
    const customer = await getCustomerProfile(user.id, supabase);
    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('SavedBrand')
      .delete()
      .eq('user_id', user.id)
      .eq('brand_id', brandId);

    if (deleteError) {
      console.error('DELETE /api/customer/saved-brands/[brandId] error:', deleteError);
      return NextResponse.json({ error: 'Failed to remove saved brand' }, { status: 500 });
    }

    const stats = await getCustomerStats(customer.id, user.id, supabase);
    return NextResponse.json({
      saved: false,
      brandId,
      stats,
    });
  } catch (err) {
    console.error('DELETE /api/customer/saved-brands/[brandId] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

