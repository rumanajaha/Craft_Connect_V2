import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request) {
  try {
    const user = await authenticate(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // Call Supabase Auth admin API to update user's password securely on the server side
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: password
    });

    if (error) {
      console.error("Auth admin password update error:", error);
      return NextResponse.json({ error: error.message || 'Failed to update password.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error("Password update endpoint error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
