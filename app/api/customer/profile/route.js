import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

export async function GET(request) {
  try {
    let user;
    try {
      user = await authenticate(request);
    } catch (authError) {
      console.error("GET CustomerProfile auth error:", authError.message || authError);
      return NextResponse.json({ error: 'Authentication failed', details: authError.message || String(authError) }, { status: 401 });
    }

    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();

    // Query CustomerProfile where owner_user_id === user.id
    const { data: profile, error: profileError } = await supabase
      .from('CustomerProfile')
      .select('*')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error("GET CustomerProfile DB error:", profileError.message);
      return NextResponse.json({ error: 'Failed to retrieve customer profile', details: profileError.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    // 1. Count Saved Brands
    const { count: saved_brands_count } = await supabase
      .from('SavedBrand')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // 2. Count Active/Pending Custom Requests
    let active_requests_count = 0;
    const { count: reqCountUser, error: reqErrorUser } = await supabase
      .from('CustomRequest')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .neq('status', 'closed');
    
    if (!reqErrorUser) {
      active_requests_count = reqCountUser || 0;
    } else {
      // Fallback if user_id is customer_id
      const { count: reqCountCust, error: reqErrorCust } = await supabase
        .from('CustomRequest')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', user.id)
        .neq('status', 'closed');
      
      if (!reqErrorCust) {
        active_requests_count = reqCountCust || 0;
      }
    }

    // 3. Count Messages involving this customer via their threads
    const { data: userThreads } = await supabase
      .from('MessageThread')
      .select('id')
      .or(`participant_a_id.eq.${user.id},participant_b_id.eq.${user.id}`);
    
    const threadIds = (userThreads || []).map(t => t.id);

    let total_messages_count = 0;
    if (threadIds.length > 0) {
      const { count } = await supabase
        .from('Message')
        .select('*', { count: 'exact', head: true })
        .in('thread_id', threadIds);
      total_messages_count = count || 0;
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        displayName: profile.display_name || '',
        phone: profile.phone_number || '',
        location: profile.location || '',
        avatarUrl: profile.avatar_url || '',
        email: user.email,
        createdAt: user.created_at || profile.created_at
      },
      stats: {
        saved_brands_count: saved_brands_count || 0,
        active_requests_count: active_requests_count || 0,
        total_messages_count: total_messages_count || 0
      }
    });

  } catch (err) {
    console.error("GET customer profile error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    let user;
    try {
      user = await authenticate(request);
    } catch (authError) {
      console.error("PATCH CustomerProfile auth error:", authError.message || authError);
      return NextResponse.json({ error: 'Authentication failed', details: authError.message || String(authError) }, { status: 401 });
    }

    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updateData = {};

    if (body.display_name !== undefined) updateData.display_name = body.display_name;
    if (body.displayName !== undefined) updateData.display_name = body.displayName;
    if (body.phone_number !== undefined) updateData.phone_number = body.phone_number;
    if (body.phone !== undefined) updateData.phone_number = body.phone;
    if (body.location !== undefined) updateData.location = body.location;

    // Validate that Full Name is present and not empty
    if (updateData.display_name !== undefined && (!updateData.display_name || !updateData.display_name.trim())) {
      return NextResponse.json({ error: 'Full Name is required' }, { status: 400 });
    }

    const supabase = getSupabaseRouteClient();

    const { data: updatedProfile, error: updateError } = await supabase
      .from('CustomerProfile')
      .update(updateData)
      .eq('owner_user_id', user.id)
      .select('*')
      .single();

    if (updateError) {
      console.error("PATCH CustomerProfile DB error:", updateError.message);
      return NextResponse.json({ error: 'Failed to update customer profile', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: updatedProfile.id,
        displayName: updatedProfile.display_name || '',
        phone: updatedProfile.phone_number || '',
        location: updatedProfile.location || '',
        avatarUrl: updatedProfile.avatar_url || ''
      }
    });

  } catch (err) {
    console.error("PATCH customer profile error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
