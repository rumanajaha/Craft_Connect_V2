import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    // Call Gemini API to generate query embedding
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const textToEmbed = `Product Type: ${productType}. Target Audience: ${audience}. Campaign Goal: ${goal}.`;
    const embedResult = await model.embedContent(textToEmbed);
    
    if (!embedResult || !embedResult.embedding || !embedResult.embedding.values) {
      return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
    }
    const queryVector = embedResult.embedding.values;

    // Fetch all CreatorProfiles
    const { data: creators, error: creatorsError } = await supabaseAdmin
      .from('CreatorProfile')
      .select('*');

    if (creatorsError) {
      return NextResponse.json({ error: 'Failed to fetch creator profiles' }, { status: 500 });
    }

    // Calculate similarity and format response
    const matches = (creators || []).map(creator => {
      let compatibility = 80; // default fallback
      const creatorVector = parseVector(creator.embedding);
      if (creatorVector) {
        const similarity = cosineSimilarity(queryVector, creatorVector);
        compatibility = Math.round(similarity * 100);
      }

      return {
        id: creator.id,
        name: creator.display_name || 'Anonymous Creator',
        avatar: null, // fill this next
        owner_user_id: creator.owner_user_id,
        niches: creator.niches || [],
        followers: creator.follower_count >= 1000 ? `${Math.round(creator.follower_count / 1000)}K` : `${creator.follower_count || 0}`,
        engagementRate: `${creator.engagement_rate || 0}%`,
        compatibility: Math.min(100, Math.max(0, compatibility))
      };
    });

    // Fetch avatars from CustomerProfile
    const creatorUserIds = matches.map(m => m.owner_user_id).filter(Boolean);
    let customerProfiles = [];
    if (creatorUserIds.length > 0) {
      const { data: custProfiles } = await supabaseAdmin
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
    matches.forEach(m => {
      m.avatar = customerAvatarMap[m.owner_user_id] || fallbackAvatar;
    });

    // Sort by compatibility descending
    const sortedMatches = matches.sort((a, b) => b.compatibility - a.compatibility);

    return NextResponse.json({ matches: sortedMatches });

  } catch (error) {
    console.error("Matches error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
