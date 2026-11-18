import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import {
  getCustomerProfile,
  getCustomerStats,
  DEFAULT_CUSTOMER_NOTIFICATION_PREFS,
} from '@/lib/getCustomerProfile';

function mergeNotificationPrefs(existing, incoming) {
  const base = {
    ...DEFAULT_CUSTOMER_NOTIFICATION_PREFS,
    ...(existing && typeof existing === 'object' ? existing : {}),
  };

  if (!incoming || typeof incoming !== 'object') {
    return base;
  }

  const merged = { ...base };
  for (const [key, val] of Object.entries(incoming)) {
    if (val && typeof val === 'object' && !Array.isArray(val) && base[key] && typeof base[key] === 'object') {
      merged[key] = { ...base[key], ...val };
    } else {
      merged[key] = val;
    }
  }
  return merged;
}

function formatProfileResponse(customer, user, stats) {
  return {
    fullName: customer.display_name || '',
    phone: customer.phone || '',
    location: customer.location || '',
    avatarUrl: customer.avatar_url || null,
    email: user.email || '',
    memberSince: customer.created_at || user.created_at || null,
    role: user.role || 'CUSTOMER',
    notificationPrefs: mergeNotificationPrefs(customer.notification_prefs, null),
    stats,
  };
}

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();
    const customer = await getCustomerProfile(user.id, supabase);
    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const stats = await getCustomerStats(customer.id, user.id, supabase);
    return NextResponse.json(formatProfileResponse(customer, user, stats));
  } catch (err) {
    console.error('GET /api/customer/profile error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();
    const customer = await getCustomerProfile(user.id, supabase);
    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const body = await request.json();
    // Explicitly ignore email and any client-supplied customer_id
    const updates = {};

    if (typeof body.fullName === 'string') {
      updates.display_name = body.fullName.trim();
    }
    if (typeof body.phone === 'string') {
      updates.phone = body.phone.trim();
    }
    if (typeof body.location === 'string') {
      updates.location = body.location.trim();
    }
    if (body.avatarUrl === null || typeof body.avatarUrl === 'string') {
      updates.avatar_url = body.avatarUrl ? body.avatarUrl.trim() : null;
    }
    if (body.notificationPrefs && typeof body.notificationPrefs === 'object') {
      updates.notification_prefs = mergeNotificationPrefs(
        customer.notification_prefs,
        body.notificationPrefs
      );
    }

    if (Object.keys(updates).length === 0) {
      const stats = await getCustomerStats(customer.id, user.id, supabase);
      return NextResponse.json(formatProfileResponse(customer, user, stats));
    }

    const { data: updated, error } = await supabase
      .from('CustomerProfile')
      .update(updates)
      .eq('id', customer.id)
      .eq('owner_user_id', user.id)
      .select('id, owner_user_id, display_name, avatar_url, location, phone, notification_prefs, created_at')
      .single();

    if (error) {
      console.error('PATCH /api/customer/profile error:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    const stats = await getCustomerStats(updated.id, user.id, supabase);
    return NextResponse.json(formatProfileResponse(updated, user, stats));
  } catch (err) {
    console.error('PATCH /api/customer/profile error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
