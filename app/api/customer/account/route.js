import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { getCustomerProfile } from '@/lib/getCustomerProfile';

async function deleteAvatarFolder(userId) {
  try {
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('customer-avatars')
      .list(userId);

    if (listError || !files || files.length === 0) return;

    const paths = files.map((f) => `${userId}/${f.name}`);
    await supabaseAdmin.storage.from('customer-avatars').remove(paths);
  } catch (err) {
    console.error('Customer avatar cleanup error (non-fatal):', err);
  }
}

export async function DELETE() {
  try {
    // 1. Authenticate via session-scoped Supabase client
    const supabase = getSupabaseRouteClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await getCustomerProfile(user.id, supabase);
    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    // 2. Call Postgres RPC delete_customer_account(user_id) first
    const { error: dbError } = await supabaseAdmin.rpc('delete_customer_account', {
      user_id: user.id,
    });

    if (dbError) {
      console.error(`delete_customer_account RPC error for ${user.id}:`, dbError.message);
      return NextResponse.json(
        { error: `Account cleanup failed: ${dbError.message}` },
        { status: 500 }
      );
    }

    // 3. Only delete auth user after DB cleanup succeeds
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      console.error(`Auth user deletion error for ${user.id}:`, deleteUserError.message);
      return NextResponse.json(
        { error: `Failed to remove auth user: ${deleteUserError.message}` },
        { status: 500 }
      );
    }

    // 4. Best-effort cleanup of customer-avatars storage folder
    await deleteAvatarFolder(user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/customer/account error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

