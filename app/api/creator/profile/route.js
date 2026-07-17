import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

export async function GET(request) {
  try {
    let user;
    try {
      user = await authenticate(request);
    } catch (authError) {
      console.error("GET CreatorProfile auth error:", authError.message || authError, authError.details || "", authError.hint || "");
      return NextResponse.json({ error: 'Authentication failed', details: authError.message || String(authError) }, { status: 401 });
    }

    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();

    // Retrieve CreatorProfile
    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('*')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (creatorError) {
      console.error("GET CreatorProfile DB error:", creatorError.message, creatorError.details, creatorError.hint);
      return NextResponse.json({
        error: 'Failed to retrieve creator profile',
        details: creatorError.message,
        db_details: creatorError.details,
        db_hint: creatorError.hint
      }, { status: 500 });
    }

    if (!creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    const avatarUrl = creator.avatar_url || '';

    // Map database notification prefs (which use newBrandMatch and push) to UI prefs (which use brandMatchFound and desktop)
    const dbPrefs = creator.notification_prefs || {
      newBrandMatch: { email: true, push: true },
      pitchResponse: { email: true, push: true },
      newMessage: { email: true, push: true }
    };

    const notification_prefs = {
      brandMatchFound: {
        email: dbPrefs.newBrandMatch?.email ?? true,
        desktop: dbPrefs.newBrandMatch?.push ?? true
      },
      pitchResponse: {
        email: dbPrefs.pitchResponse?.email ?? true,
        desktop: dbPrefs.pitchResponse?.push ?? true
      },
      newMessage: {
        email: dbPrefs.newMessage?.email ?? true,
        desktop: dbPrefs.newMessage?.push ?? true
      }
    };

    // Map database fields to frontend model
    const profile = {
      id: creator.id,
      displayName: creator.display_name || '',
      display_name: creator.display_name || '',
      bio: creator.bio || '',
      niches: creator.niches ? creator.niches.join(', ') : '',
      follower_count: creator.follower_count || 0,
      followers: creator.follower_count || 0,
      engagement_rate: creator.engagement_rate || 0,
      engagementRate: creator.engagement_rate || 0,
      ai_tags: creator.ai_tags ? creator.ai_tags.join(', ') : '',
      tags: creator.ai_tags ? creator.ai_tags.join(', ') : '',
      instagram_url: creator.instagram_url || '',
      instagram: creator.instagram_url || '',
      tiktok_url: creator.tiktok_url || '',
      tiktok: creator.tiktok_url || '',
      youtube_url: creator.youtube_url || '',
      youtube: creator.youtube_url || '',
      avatar_url: avatarUrl,
      avatar: avatarUrl,
      notification_prefs
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("GET CreatorProfile general error:", error.message || error, error.details || "", error.hint || "");
    return NextResponse.json({ error: 'Internal server error', details: error.message || String(error) }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    let user;
    try {
      user = await authenticate(request);
    } catch (authError) {
      console.error("PATCH CreatorProfile auth error:", authError.message || authError, authError.details || "", authError.hint || "");
      return NextResponse.json({ error: 'Authentication failed', details: authError.message || String(authError) }, { status: 401 });
    }

    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();

    // Get current CreatorProfile
    const { data: creator, error: creatorError } = await supabase
      .from('CreatorProfile')
      .select('id, notification_prefs')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (creatorError) {
      console.error("PATCH CreatorProfile retrieve error:", creatorError.message, creatorError.details, creatorError.hint);
      return NextResponse.json({
        error: 'Failed to retrieve current creator profile',
        details: creatorError.message,
        db_details: creatorError.details,
        db_hint: creatorError.hint
      }, { status: 500 });
    }

    if (!creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const updateData = {};

    if (body.display_name !== undefined) updateData.display_name = body.display_name;
    if (body.displayName !== undefined) updateData.display_name = body.displayName;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.instagram_url !== undefined) updateData.instagram_url = body.instagram_url;
    if (body.instagram !== undefined) updateData.instagram_url = body.instagram;
    if (body.tiktok_url !== undefined) updateData.tiktok_url = body.tiktok_url;
    if (body.tiktok !== undefined) updateData.tiktok_url = body.tiktok;
    if (body.youtube_url !== undefined) updateData.youtube_url = body.youtube_url;
    if (body.youtube !== undefined) updateData.youtube_url = body.youtube;
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url;
    if (body.avatar !== undefined) updateData.avatar_url = body.avatar;

    // Validate follower_count
    if (body.followers !== undefined || body.follower_count !== undefined) {
      const followersVal = body.followers !== undefined ? body.followers : body.follower_count;
      const followersNum = Number(followersVal);
      if (isNaN(followersNum) || followersNum < 0) {
        return NextResponse.json({ error: 'Follower count must be a non-negative number' }, { status: 400 });
      }
      updateData.follower_count = Math.floor(followersNum);
    }

    // Validate engagement_rate
    if (body.engagementRate !== undefined || body.engagement_rate !== undefined) {
      const engagementVal = body.engagementRate !== undefined ? body.engagementRate : body.engagement_rate;
      const engagementNum = Number(engagementVal);
      if (isNaN(engagementNum) || engagementNum < 0) {
        return NextResponse.json({ error: 'Engagement rate must be a non-negative number' }, { status: 400 });
      }
      updateData.engagement_rate = engagementNum;
    }

    // Process niches split/trim
    if (body.niches !== undefined) {
      updateData.niches = typeof body.niches === 'string'
        ? body.niches.split(',').map(s => s.trim()).filter(Boolean)
        : (Array.isArray(body.niches) ? body.niches.map(s => String(s).trim()).filter(Boolean) : []);
    }

    // Process ai_tags split/trim
    if (body.tags !== undefined || body.ai_tags !== undefined) {
      const tagsVal = body.tags !== undefined ? body.tags : body.ai_tags;
      updateData.ai_tags = typeof tagsVal === 'string'
        ? tagsVal.split(',').map(s => s.trim()).filter(Boolean)
        : (Array.isArray(tagsVal) ? tagsVal.map(s => String(s).trim()).filter(Boolean) : []);
    }

    // Process notification_prefs (translate UI format to database format)
    const currentPrefs = creator.notification_prefs || {
      newBrandMatch: { email: true, push: true },
      pitchResponse: { email: true, push: true },
      newMessage: { email: true, push: true }
    };
    const updatedPrefs = { ...currentPrefs };

    if (body.notification_prefs !== undefined) {
      const bodyPrefs = body.notification_prefs;
      if (bodyPrefs.brandMatchFound !== undefined) {
        updatedPrefs.newBrandMatch = {
          email: bodyPrefs.brandMatchFound.email ?? true,
          push: bodyPrefs.brandMatchFound.desktop ?? true
        };
      }
      if (bodyPrefs.pitchResponse !== undefined) {
        updatedPrefs.pitchResponse = {
          email: bodyPrefs.pitchResponse.email ?? true,
          push: bodyPrefs.pitchResponse.desktop ?? true
        };
      }
      if (bodyPrefs.newMessage !== undefined) {
        updatedPrefs.newMessage = {
          email: bodyPrefs.newMessage.email ?? true,
          push: bodyPrefs.newMessage.desktop ?? true
        };
      }
    }
    updateData.notification_prefs = updatedPrefs;

    // Update CreatorProfile in Supabase
    const { data: updatedCreator, error: updateError } = await supabase
      .from('CreatorProfile')
      .update(updateData)
      .eq('id', creator.id)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error("PATCH CreatorProfile update error:", updateError.message, updateError.details, updateError.hint);
      return NextResponse.json({
        error: 'Failed to update creator profile',
        details: updateError.message,
        db_details: updateError.details,
        db_hint: updateError.hint
      }, { status: 500 });
    }

    if (!updatedCreator) {
      return NextResponse.json({ error: 'Failed to update profile (no data returned)' }, { status: 500 });
    }

    // Log follower count change in FollowerHistory
    if (updateData.follower_count !== undefined) {
      const { error: histError } = await supabase
        .from('FollowerHistory')
        .insert({
          creator_id: creator.id,
          follower_count: updateData.follower_count
        });
      if (histError) {
        console.error("PATCH FollowerHistory error:", histError.message, histError.details, histError.hint);
      }
    }

    const finalAvatar = updatedCreator.avatar_url || '';

    // Re-map db notification prefs back to UI format for consistency
    const finalDbPrefs = updatedCreator.notification_prefs || updatedPrefs;
    const finalUIPrefs = {
      brandMatchFound: {
        email: finalDbPrefs.newBrandMatch?.email ?? true,
        desktop: finalDbPrefs.newBrandMatch?.push ?? true
      },
      pitchResponse: {
        email: finalDbPrefs.pitchResponse?.email ?? true,
        desktop: finalDbPrefs.pitchResponse?.push ?? true
      },
      newMessage: {
        email: finalDbPrefs.newMessage?.email ?? true,
        desktop: finalDbPrefs.newMessage?.push ?? true
      }
    };

    // Return the updated profile
    const profile = {
      id: updatedCreator.id,
      displayName: updatedCreator.display_name || '',
      display_name: updatedCreator.display_name || '',
      bio: updatedCreator.bio || '',
      niches: updatedCreator.niches ? updatedCreator.niches.join(', ') : '',
      follower_count: updatedCreator.follower_count || 0,
      followers: updatedCreator.follower_count || 0,
      engagement_rate: updatedCreator.engagement_rate || 0,
      engagementRate: updatedCreator.engagement_rate || 0,
      ai_tags: updatedCreator.ai_tags ? updatedCreator.ai_tags.join(', ') : '',
      tags: updatedCreator.ai_tags ? updatedCreator.ai_tags.join(', ') : '',
      instagram_url: updatedCreator.instagram_url || '',
      instagram: updatedCreator.instagram_url || '',
      tiktok_url: updatedCreator.tiktok_url || '',
      tiktok: updatedCreator.tiktok_url || '',
      youtube_url: updatedCreator.youtube_url || '',
      youtube: updatedCreator.youtube_url || '',
      avatar_url: finalAvatar,
      avatar: finalAvatar,
      notification_prefs: finalUIPrefs
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("PATCH CreatorProfile general error:", error.message || error, error.details || "", error.hint || "");
    return NextResponse.json({ error: 'Internal server error', details: error.message || String(error) }, { status: 500 });
  }
}
