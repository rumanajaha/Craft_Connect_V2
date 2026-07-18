import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { authenticate } from '@/middleware/auth';

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();
    const { error } = await supabase.auth.signOut({ scope: 'others' });

    if (error) {
      console.error("Sign out others failed:", error);
      return NextResponse.json({ error: error.message || 'Failed to log out of other devices' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'All other active sessions terminated successfully' });
  } catch (error) {
    console.error("Log out others endpoint error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
