import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

export const DEFAULT_CUSTOMER_NOTIFICATION_PREFS = {
  newMessage: { email: true, desktop: true },
  brandResponse: { email: true, desktop: true },
  requestStatus: { email: false, desktop: false },
  newRecommended: { email: false, desktop: false },
  weeklyDigest: { email: true, desktop: false },
  securityAlerts: { email: true, desktop: false },
};

/**
 * Derives the authenticated customer's CustomerProfile row server-side
 * from the session userId using the session-scoped Supabase client (RLS).
 * Never trust a client-supplied customer_id.
 *
 * @param {string} userId - Authenticated auth.users id from session
 * @param {object} [supabaseClient] - Optional session-scoped Supabase client
 * @returns {Promise<object|null>} CustomerProfile row or null
 */
export async function getCustomerProfile(userId, supabaseClient) {
  if (!userId) return null;
  const supabase = supabaseClient || getSupabaseRouteClient();

  const { data, error } = await supabase
    .from('CustomerProfile')
    .select('id, owner_user_id, display_name, avatar_url, location, phone, notification_prefs, created_at')
    .eq('owner_user_id', userId)
    .maybeSingle();

  if (error) {
    // Fallback select if notification_prefs column hasn't been added yet
    const fallback = await supabase
      .from('CustomerProfile')
      .select('id, owner_user_id, display_name, avatar_url, location, phone, created_at')
      .eq('owner_user_id', userId)
      .maybeSingle();

    if (fallback.error) {
      console.error('getCustomerProfile error:', fallback.error.message);
      return null;
    }
    return fallback.data ? { ...fallback.data, notification_prefs: null } : null;
  }

  return data || null;
}

/**
 * Shared customer activity stats helper.
 * Always filters by server-derived customerId (CustomerProfile.id) and session userId.
 *
 * @param {string} customerId - CustomerProfile.id
 * @param {string} [userId] - auth.users id (derived from CustomerProfile if omitted)
 * @param {object} [supabaseClient] - Session-scoped Supabase client
 * @returns {Promise<{ savedBrands: number, activeRequests: number, totalMessages: number }>}
 */
export async function getCustomerStats(customerId, userId, supabaseClient) {
  const supabase = supabaseClient || getSupabaseRouteClient();
  let ownerUserId = userId;

  if (!ownerUserId && customerId) {
    const { data: profileRow } = await supabase
      .from('CustomerProfile')
      .select('owner_user_id')
      .eq('id', customerId)
      .maybeSingle();
    ownerUserId = profileRow?.owner_user_id || null;
  }

  const [savedRes, requestsRes, threadsRes] = await Promise.all([
    ownerUserId
      ? supabase
          .from('SavedBrand')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', ownerUserId)
      : Promise.resolve({ count: 0 }),
    customerId
      ? supabase
          .from('CustomRequest')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', customerId)
          .neq('status', 'closed')
      : Promise.resolve({ count: 0 }),
    ownerUserId
      ? supabase
          .from('MessageThread')
          .select('id')
          .or(`participant_a_id.eq.${ownerUserId},participant_b_id.eq.${ownerUserId}`)
      : Promise.resolve({ data: [] }),
  ]);

  let totalMessages = 0;
  const threadIds = (threadsRes.data || []).map((t) => t.id);
  if (threadIds.length > 0) {
    const { count: msgCount } = await supabase
      .from('Message')
      .select('id', { count: 'exact', head: true })
      .in('thread_id', threadIds);
    totalMessages = msgCount || 0;
  }

  return {
    savedBrands: savedRes.count || 0,
    activeRequests: requestsRes.error ? 0 : (requestsRes.count || 0),
    totalMessages,
  };
}

export default getCustomerProfile;
