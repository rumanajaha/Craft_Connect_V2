import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      message: 'Welcome Brand Owner',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("GET brandowner profile error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
