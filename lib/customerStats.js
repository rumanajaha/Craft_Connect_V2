import { supabaseAdmin } from '@/lib/supabaseServer';

export async function getCustomerStats(userId) {
  // 1. Resolve CustomerProfile.id (use admin to bypass RLS)
  const { data: customerProfile } = await supabaseAdmin
    .from('CustomerProfile')
    .select('id')
    .eq('owner_user_id', userId)
    .maybeSingle();

  const customerProfileId = customerProfile?.id || userId;

  // 2. Count Saved Brands using customer_id
  const { count: saved_brands_count } = await supabaseAdmin
    .from('SavedBrand')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerProfileId);

  // 3. Count Active/Pending Custom Requests
  const { count: reqCountCust } = await supabaseAdmin
    .from('CustomRequest')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerProfileId)
    .neq('status', 'closed');

  // 4. Count Messages involving this customer
  const { data: userThreads } = await supabaseAdmin
    .from('MessageThread')
    .select('id')
    .or(`participant_a_id.eq.${userId},participant_b_id.eq.${userId}`);
  
  const threadIds = (userThreads || []).map(t => t.id);

  let total_messages_count = 0;
  if (threadIds.length > 0) {
    const { count } = await supabaseAdmin
      .from('Message')
      .select('*', { count: 'exact', head: true })
      .in('thread_id', threadIds);
    total_messages_count = count || 0;
  }

  return {
    saved_brands_count: saved_brands_count || 0,
    active_requests_count: reqCountCust || 0,
    total_messages_count: total_messages_count || 0
  };
}
