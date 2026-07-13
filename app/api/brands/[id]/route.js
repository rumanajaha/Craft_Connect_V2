import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { supabaseAdmin } from '@/lib/supabaseServer';

// TRUST SCORE FORMULA (server-side only, not user-editable)
// Base score: 50
// 1. Rating contribution: (rating_avg / 5) * 25  => max 25 points
// 2. Account age contribution: min(15, days_since_creation / 30 * 5)
//    => 5 points per month, capped at 15 points (3 months)
// 3. Verification status: +10 if verified_at is present
// 4. Response rate: +10 if response_rate >= 0.8
//
// Total: base 50 + rating (max 25) + age (max 15) + verified (10) + response (10) = max 110
// Clamped to 0-100.
//
// TUNE WEIGHTS HERE:
// - ratingWeight = 25
// - ageWeightPerMonth = 5, ageCap = 15
// - verifiedBonus = 10
// - responseRateBonus = 10
// ============================================================

function computeTrustScore({ rating_avg, created_at, verified_at, response_rate }) {
  const ratingWeight = 25;
  const ageWeightPerMonth = 5;
  const ageCap = 15;
  const verifiedBonus = 10;
  const responseRateBonus = 10;

  let score = 50;

  const rating = typeof rating_avg === 'number' ? rating_avg : 0;
  score += Math.min(ratingWeight, (rating / 5) * ratingWeight);

  if (created_at) {
    const ageInDays = (Date.now() - new Date(created_at).getTime()) / (1000 * 60 * 60 * 24);
    const months = ageInDays / 30;
    score += Math.min(ageCap, months * ageWeightPerMonth);
  }

  if (verified_at) {
    score += verifiedBonus;
  }

  if (typeof response_rate === 'number' && response_rate >= 0.8) {
    score += responseRateBonus;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const supabase = getSupabaseRouteClient();

    const { data: brand, error: brandError } = await supabase
      .from('BrandProfile')
      .select('id, brand_name, category, location, website_url, logo_url, banner_video_url, description, ai_tags, rating_avg, review_count, trust_score, created_at, verified_at, response_rate')
      .eq('id', id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const trustScore = computeTrustScore({
      rating_avg: brand.rating_avg,
      created_at: brand.created_at,
      verified_at: brand.verified_at,
      response_rate: brand.response_rate,
    });

    let isSaved = false;
    try {
      const authRes = await fetch(new URL('/api/auth/me', request.url), {
        headers: { cookie: request.headers.get('cookie') || '' }
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        const userId = authData?.user?.id;
        if (userId) {
          const { data: saved } = await supabase
            .from('SavedBrand')
            .select('id')
            .eq('user_id', userId)
            .eq('brand_id', brand.id)
            .maybeSingle();
          isSaved = !!saved;
        }
      }
    } catch {
    }

    const profile = {
      id: brand.id,
      name: brand.brand_name || '',
      category: brand.category || '',
      location: brand.location || '',
      website: brand.website_url || '',
      logo: brand.logo_url || '',
      banner: brand.banner_video_url || '',
      description: brand.description || '',
      tags: brand.ai_tags || [],
      rating: brand.rating_avg !== null ? Number(brand.rating_avg) : 0,
      reviewsCount: brand.review_count !== null ? Number(brand.review_count) : 0,
      trustScore,
      isSaved,
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("GET public brand profile error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
