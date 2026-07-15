import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { searchUsers } from '@/lib/searchUsers';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';

    const supabase = getSupabaseRouteClient();


    const results = await searchUsers(supabase, {
      q,
      type,
      currentUserId: user.id
    });

    // 5. Return results
    return NextResponse.json({ users: results });
  } catch (error) {
    console.error("GET /api/search/users error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
