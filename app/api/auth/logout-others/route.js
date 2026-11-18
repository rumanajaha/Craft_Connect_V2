import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

export async function POST() {
  try {
    const supabase = getSupabaseRouteClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase.auth.signOut({ scope: 'others' });
    if (error) {
      console.error('POST /api/auth/logout-others error:', error.message);
      return NextResponse.json(
        { error: error.message || 'Failed to sign out other sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/auth/logout-others unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

