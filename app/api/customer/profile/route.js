import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { getCustomerStats } from '@/lib/customerStats';
import { supabaseAdmin } from '@/lib/supabaseServer';

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

    // Retrieve stats using shared helper function
    const stats = await getCustomerStats(user.id);

    return NextResponse.json({
      profile: {
        id: profile.id,
        displayName: profile.display_name || '',
        phone: profile.phone_number || '',
        location: profile.location || '',
        avatarUrl: profile.avatar_url || '',
        email: user.email,
        createdAt: user.created_at || profile.created_at,
        notification_prefs: profile.notification_prefs || {}
      },
      stats
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
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url;
    if (body.avatarUrl !== undefined) updateData.avatar_url = body.avatarUrl;

    // Validate that Full Name is present and not empty
    if (updateData.display_name !== undefined && (!updateData.display_name || !updateData.display_name.trim())) {
      return NextResponse.json({ error: 'Full Name is required' }, { status: 400 });
    }

    const supabase = getSupabaseRouteClient();

    // Query existing profile to merge notification_prefs
    const { data: currentProfile, error: getError } = await supabase
      .from('CustomerProfile')
      .select('notification_prefs')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (getError) {
      console.error("PATCH CustomerProfile GET error:", getError.message);
      return NextResponse.json({ error: 'Failed to retrieve profile for merging', details: getError.message }, { status: 500 });
    }

    if (body.notification_prefs !== undefined) {
      const dbPrefs = body.notification_prefs;
      const currentPrefs = currentProfile?.notification_prefs || {};
      updateData.notification_prefs = {
        ...currentPrefs,
        ...dbPrefs
      };
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
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
        avatarUrl: updatedProfile.avatar_url || '',
        notification_prefs: updatedProfile.notification_prefs || {}
      }
    });

  } catch (err) {
    console.error("PATCH customer profile error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
