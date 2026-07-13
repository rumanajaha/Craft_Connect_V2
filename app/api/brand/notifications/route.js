import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(request) {
  try {
    const user = await authenticate(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: notifications, error } = await supabaseAdmin
      .from('Notification')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Notifications fetch error:", error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    return NextResponse.json({ notifications: notifications || [] });

  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await authenticate(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from('Notification')
      .update({ is_read: true })
      .eq('user_id', user.id);

    if (error) {
      console.error("Notifications mark as read error:", error);
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
