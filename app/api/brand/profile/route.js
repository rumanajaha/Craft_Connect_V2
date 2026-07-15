import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

export async function GET(request) {
  try {
    const user = await authenticate(request);

    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Retrieve BrandProfile
    const supabase = getSupabaseRouteClient();
    const { data: brand, error: brandError } = await supabase
      .from('BrandProfile')
      .select('*')
      .eq('owner_user_id', user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    // Map database fields to frontend model
    const profile = {
      id: brand.id,
      name: brand.brand_name || '',
      category: brand.category || 'Ceramics',
      location: brand.location || '',
      website: brand.website_url || '',
      logo: brand.logo_url || '',
      logoUrl: brand.logo_url || '',
      videoUrl: brand.banner_video_url || '',
      description: brand.description || '',
      tags: brand.ai_tags ? brand.ai_tags.join(', ') : '',
      instagram: brand.notification_prefs?.instagram || '',
      tiktok: brand.notification_prefs?.tiktok || '',
      rating: brand.rating_avg !== null ? Number(brand.rating_avg) : 4.9,
      reviews: brand.review_count !== null ? Number(brand.review_count) : 42,
      notification_prefs: brand.notification_prefs || {
        newPitch: { email: true, desktop: true },
        newRequest: { email: true, desktop: true },
        aiMatch: { email: false, desktop: true },
        messages: { email: true, desktop: true }
      }
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("GET BrandProfile error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await authenticate(request);

    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();
    const { data: brand, error: brandError } = await supabase
      .from('BrandProfile')
      .select('id, notification_prefs')
      .eq('owner_user_id', user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    const body = await request.json();

    // Silently ignore rating/reviews changes (user request specification)
    const updateData = {};

    if (body.name !== undefined) updateData.brand_name = body.name;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.website !== undefined) updateData.website_url = body.website;
    if (body.videoUrl !== undefined) updateData.banner_video_url = body.videoUrl;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.logo !== undefined) updateData.logo_url = body.logo;
    if (body.logoUrl !== undefined) updateData.logo_url = body.logoUrl;

    // Store instagram and tiktok handles in notification_prefs to avoid schema column errors
    const currentPrefs = brand.notification_prefs || {
      newPitch: { email: true, desktop: true },
      newRequest: { email: true, desktop: true },
      aiMatch: { email: false, desktop: true },
      messages: { email: true, desktop: true }
    };
    const updatedPrefs = { ...currentPrefs };
    if (body.notification_prefs !== undefined) {
      Object.assign(updatedPrefs, body.notification_prefs);
    }
    if (body.instagram !== undefined) updatedPrefs.instagram = body.instagram;
    if (body.tiktok !== undefined) updatedPrefs.tiktok = body.tiktok;
    updateData.notification_prefs = updatedPrefs;

    if (body.tags !== undefined) {
      updateData.ai_tags = body.tags
        ? body.tags.split(',').map(s => s.trim()).filter(Boolean)
        : [];
    }

    const { data: updatedBrand, error: updateError } = await supabase
      .from('BrandProfile')
      .update(updateData)
      .eq('id', brand.id)
      .select()
      .single();

    if (updateError) {
      console.error("PATCH BrandProfile DB error:", updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Map updated database fields to frontend model
    const profile = {
      id: updatedBrand.id,
      name: updatedBrand.brand_name || '',
      category: updatedBrand.category || 'Ceramics',
      location: updatedBrand.location || '',
      website: updatedBrand.website_url || '',
      logo: updatedBrand.logo_url || '',
      logoUrl: updatedBrand.logo_url || '',
      videoUrl: updatedBrand.banner_video_url || '',
      description: updatedBrand.description || '',
      tags: updatedBrand.ai_tags ? updatedBrand.ai_tags.join(', ') : '',
      instagram: updatedBrand.notification_prefs?.instagram || '',
      tiktok: updatedBrand.notification_prefs?.tiktok || '',
      rating: updatedBrand.rating_avg !== null ? Number(updatedBrand.rating_avg) : 4.9,
      reviews: updatedBrand.review_count !== null ? Number(updatedBrand.review_count) : 42,
      notification_prefs: updatedBrand.notification_prefs
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("PATCH BrandProfile error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
