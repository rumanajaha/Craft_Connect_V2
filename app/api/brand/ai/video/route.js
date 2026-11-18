import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';

export async function POST(request) {
  const user = await authenticate(request);
  if (!user || user.role !== 'BRANDOWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    { error: 'Not available yet' },
    { status: 501 }
  );
}
