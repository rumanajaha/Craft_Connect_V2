import { supabaseAdmin } from './supabaseServer';
import { getGeminiEmbedding } from './gemini';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';

/**
 * Build the embedding text for a creator profile.
 * Combines niches + ai_tags + bio into a single descriptive string.
 */
export function buildCreatorEmbeddingText(creator) {
  const niches = Array.isArray(creator.niches) ? creator.niches.join(', ') : (creator.niches || '');
  const tags = Array.isArray(creator.ai_tags) ? creator.ai_tags.join(', ') : (creator.ai_tags || '');
  const bio = creator.bio || '';
  return `Niches: ${niches}. Tags: ${tags}. Bio: ${bio}`.trim();
}

/**
 * Regenerate and store the embedding for a single creator profile.
 * Called automatically on profile PATCH when niches/ai_tags/bio change.
 */
export async function updateCreatorEmbedding(creatorId, creator) {
  try {
    const text = buildCreatorEmbeddingText(creator);
    if (!text || text === 'Niches: . Tags: . Bio:') return; // nothing to embed
    const embedding = await getGeminiEmbedding(text);
    const { error } = await supabaseAdmin
      .from('CreatorProfile')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', creatorId);
    if (error) {
      console.error('updateCreatorEmbedding DB error:', error.message);
    }
  } catch (err) {
    // Never throw from here — embedding is a background enhancement, not critical
    console.error('updateCreatorEmbedding failed (non-fatal):', err.message);
  }
}

/**
 * Query CreatorProfile using pgvector cosine distance (<=>).
 * Uses a Supabase RPC function `match_creators` that runs:
 *   SELECT id, display_name, niches, ai_tags, follower_count, engagement_rate,
 *          avatar_url, owner_user_id,
 *          (embedding <=> query_embedding) AS distance
 *   FROM "CreatorProfile"
 *   ORDER BY distance ASC
 *   LIMIT match_count;
 *
 * Falls back to JavaScript cosine similarity if RPC is unavailable.
 */
export async function getCreatorMatches({ productType, audience, goal, distinctValue, compensation }) {
  const searchText = [
    productType ? `Product: ${productType}` : '',
    audience ? `Audience: ${audience}` : '',
    goal ? `Goal: ${goal}` : '',
    compensation ? `Compensation: ${compensation}` : '',
    distinctValue ? `Value: ${distinctValue}` : '',
  ].filter(Boolean).join('. ');

  const queryVector = await getGeminiEmbedding(searchText);

  // Try pgvector RPC first (O(n) with index, proper cosine distance)
  const { data: rpcResults, error: rpcError } = await supabaseAdmin
    .rpc('match_creators', {
      query_embedding: queryVector,
      match_count: 10
    });

  if (!rpcError && rpcResults) {
    return rpcResults.map(row => ({
      id: row.id,
      name: row.display_name || 'Anonymous Creator',
      avatar: row.avatar_url || FALLBACK_AVATAR,
      owner_user_id: row.owner_user_id,
      niches: Array.isArray(row.niches) ? row.niches : (row.niches || []),
      followers: formatFollowers(row.follower_count),
      engagementRate: `${row.engagement_rate || 0}%`,
      // distance 0 = identical, 2 = opposite. Convert to 0-100% match score.
      compatibility: Math.round(Math.max(0, (1 - row.distance / 2)) * 100)
    }));
  }

  // Fallback: JS cosine similarity (no pgvector RPC available yet)
  if (rpcError) {
    console.warn('match_creators RPC unavailable, falling back to JS cosine:', rpcError.message);
  }

  const { data: creators, error: creatorsError } = await supabaseAdmin
    .from('CreatorProfile')
    .select('id, display_name, niches, ai_tags, follower_count, engagement_rate, avatar_url, owner_user_id, embedding');

  if (creatorsError) {
    throw new Error('Failed to fetch creator profiles: ' + creatorsError.message);
  }

  const matches = (creators || []).map(creator => {
    let compatibility = 50; // neutral fallback for no-embedding creators
    if (creator.embedding) {
      const creatorVector = parseVector(creator.embedding);
      if (creatorVector && creatorVector.length === queryVector.length) {
        const similarity = cosineSimilarity(queryVector, creatorVector);
        compatibility = Math.round(Math.max(0, Math.min(100, similarity * 100)));
      }
    }
    return {
      id: creator.id,
      name: creator.display_name || 'Anonymous Creator',
      avatar: creator.avatar_url || FALLBACK_AVATAR,
      owner_user_id: creator.owner_user_id,
      niches: Array.isArray(creator.niches) ? creator.niches : (creator.niches || []),
      followers: formatFollowers(creator.follower_count),
      engagementRate: `${creator.engagement_rate || 0}%`,
      compatibility
    };
  });

  return matches.sort((a, b) => b.compatibility - a.compatibility);
}

// --- Helpers ---

function formatFollowers(count) {
  if (!count) return '0';
  return count >= 1000 ? `${Math.round(count / 1000)}K` : `${count}`;
}

function parseVector(val) {
  if (!val) return null;
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      return val.replace(/[\[\]]/g, '').split(',').map(Number);
    } catch {
      return null;
    }
  }
  return null;
}

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
