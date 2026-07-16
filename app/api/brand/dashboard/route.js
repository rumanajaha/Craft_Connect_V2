import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

// Helper to parse pgvector format
function parseVector(val) {
  if (!val) return null;
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      return val.replace(/[\[\]]/g, '').split(',').map(Number);
    } catch (e) {
      return null;
    }
  }
  return null;
}

// Cosine similarity helper
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();

    // Get BrandProfile
    const { data: brand, error: brandError } = await supabase
      .from('BrandProfile')
      .select('*')
      .eq('owner_user_id', user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    // 1. Get active products count (status != 'sold_out')
    const { count: activeProducts } = await supabase
      .from('Product')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brand.id)
      .neq('status', 'sold_out');

    // 2. Get pending requests count (brand_id = brand.id, status = 'pending', direction = 'outgoing')
    const { count: pendingRequests } = await supabase
      .from('CollabRequest')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brand.id)
      .eq('status', 'pending')
      .eq('direction', 'outgoing');

    // 3. Get recent creators to calculate similarity and recommendation (optimized query limit)
    const { data: creators } = await supabase
      .from('CreatorProfile')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    const lastViewed = brand.last_viewed_matches_at || '1970-01-01T00:00:00Z';
    const brandVector = parseVector(brand.embedding);

    let newAiMatches = 0;
    const creatorsWithCompatibility = (creators || []).map(creator => {
      let compatibility = 80; // default fallback
      const creatorVector = parseVector(creator.embedding);
      if (brandVector && creatorVector) {
        const similarity = cosineSimilarity(brandVector, creatorVector);
        compatibility = Math.round(similarity * 100);
        
        // Count as new match if created after last_viewed_matches_at and similarity >= 80%
        if (creator.created_at > lastViewed && compatibility >= 80) {
          newAiMatches++;
        }
      }
      
      return {
        id: creator.id,
        name: creator.display_name || 'Anonymous Creator',
        avatar: null, // we will fill this next
        owner_user_id: creator.owner_user_id,
        niches: creator.niches || [],
        followers: creator.follower_count >= 1000 ? `${Math.round(creator.follower_count / 1000)}K` : `${creator.follower_count || 0}`,
        engagementRate: `${creator.engagement_rate || 0}%`,
        compatibility: Math.min(100, Math.max(0, compatibility))
      };
    });

    // Fetch avatar_urls from CustomerProfile to map to creator.avatar
    const creatorUserIds = creatorsWithCompatibility.map(c => c.owner_user_id).filter(Boolean);
    let customerProfiles = [];
    if (creatorUserIds.length > 0) {
      const { data: custProfiles } = await supabase
        .from('CustomerProfile')
        .select('owner_user_id, avatar_url')
        .in('owner_user_id', creatorUserIds);
      customerProfiles = custProfiles || [];
    }

    const customerAvatarMap = {};
    customerProfiles.forEach(p => {
      customerAvatarMap[p.owner_user_id] = p.avatar_url;
    });

    const fallbackAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';
    creatorsWithCompatibility.forEach(c => {
      c.avatar = customerAvatarMap[c.owner_user_id] || fallbackAvatar;
    });

    // Update last_viewed_matches_at to now
    await supabase
      .from('BrandProfile')
      .update({ last_viewed_matches_at: new Date().toISOString() })
      .eq('id', brand.id);

    // 4. Fetch incoming pitches (direction = 'outgoing' from creator's perspective)
    const { data: pitchesData } = await supabase
      .from('CollabRequest')
      .select('id, creator_id, compensation_type, pitch_message, created_at, status')
      .eq('brand_id', brand.id)
      .eq('status', 'pending')
      .eq('direction', 'outgoing')
      .order('created_at', { ascending: false });

    // Join pitches with CreatorProfile display_name/avatar
    const formattedPitches = [];
    if (pitchesData && pitchesData.length > 0) {
      const pitchCreatorIds = pitchesData.map(p => p.creator_id).filter(Boolean);
      const { data: pitchCreators } = await supabase
        .from('CreatorProfile')
        .select('id, owner_user_id, display_name')
        .in('id', pitchCreatorIds);

      const creatorMap = {};
      (pitchCreators || []).forEach(pc => {
        creatorMap[pc.id] = {
          name: pc.display_name || 'Anonymous Creator',
          owner_user_id: pc.owner_user_id
        };
      });

      pitchesData.forEach(pitch => {
        const creatorInfo = creatorMap[pitch.creator_id] || {};
        const creatorAvatar = customerAvatarMap[creatorInfo.owner_user_id] || fallbackAvatar;
        formattedPitches.push({
          id: pitch.id,
          creatorId: pitch.creator_id,
          creatorName: creatorInfo.name || 'Anonymous Creator',
          creatorAvatar: creatorAvatar,
          compensation: pitch.compensation_type || 'discuss',
          snippet: pitch.pitch_message || '',
          date: pitch.created_at ? pitch.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          status: pitch.status
        });
      });
    }

    // Sort creators by compatibility for recommendation section, return top 5
    const recommendedCreators = creatorsWithCompatibility
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, 5);

    return NextResponse.json({
      activeProducts,
      pendingRequests,
      aiMatches: newAiMatches,
      pitches: formattedPitches,
      creators: recommendedCreators
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
