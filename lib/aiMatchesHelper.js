import { supabaseAdmin } from './supabaseServer';
import { getGeminiEmbedding } from './gemini';

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

export async function getCreatorMatches({ productType, audience, goal }) {
  const textToEmbed = `Product Type: ${productType}. Target Audience: ${audience}. Campaign Goal: ${goal}.`;
  const queryVector = await getGeminiEmbedding(textToEmbed);

  // Fetch all CreatorProfiles
  const { data: creators, error: creatorsError } = await supabaseAdmin
    .from('CreatorProfile')
    .select('*');

  if (creatorsError) {
    throw new Error('Failed to fetch creator profiles: ' + creatorsError.message);
  }

  const fallbackAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';

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
      avatar: creator.avatar_url || fallbackAvatar,
      owner_user_id: creator.owner_user_id,
      niches: creator.niches || [],
      followers: creator.follower_count >= 1000 ? `${Math.round(creator.follower_count / 1000)}K` : `${creator.follower_count || 0}`,
      engagementRate: `${creator.engagement_rate || 0}%`,
      compatibility: Math.min(100, Math.max(0, compatibility))
    };
  });

  // Sort by compatibility descending
  return matches.sort((a, b) => b.compatibility - a.compatibility);
}
