import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { matchByEmbedding } from '@/lib/matching';

export async function POST(request) {
  try {
    const user = await authenticate(request);

    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const productType = body.productType;
    const audience = body.audience || body.targetAudience;
    const goal = body.goal || body.campaignGoal;

    if (!productType || !audience || !goal) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const queryText = [
      `Product: ${productType}`,
      `Audience: ${audience}`,
      `Goal: ${goal}`,
    ].join('. ');

    const matches = await matchByEmbedding(queryText, 'CreatorProfile', { limit: 10 });

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Matches error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
