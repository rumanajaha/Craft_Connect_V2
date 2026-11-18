import { supabaseAdmin } from './supabaseServer';
import { getGeminiEmbedding } from './gemini';
import { toBrandCard } from './mappers';

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';

// ─── Shared vector helpers ────────────────────────────────────────────────────

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

/**
 * Averages an array of raw pgvector embeddings (string or number[]) into a
 * single normalized centroid vector. Returns null if no valid vectors exist.
 */
export function averageVectors(rawVectors) {
  const parsed = (rawVectors || [])
    .map(parseVector)
    .filter((v) => Array.isArray(v) && v.length > 0 && v.every((n) => Number.isFinite(n)));

  if (parsed.length === 0) return null;

  const dims = parsed[0].length;
  const sameDim = parsed.filter((v) => v.length === dims);
  if (sameDim.length === 0) return null;

  const sum = new Array(dims).fill(0);
  for (const vec of sameDim) {
    for (let i = 0; i < dims; i++) {
      sum[i] += vec[i];
    }
  }

  let norm = 0;
  for (let i = 0; i < dims; i++) {
    sum[i] /= sameDim.length;
    norm += sum[i] * sum[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dims; i++) {
      sum[i] /= norm;
    }
  }
  return sum;
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

/**
 * Convert pgvector cosine distance (0 = identical, 2 = opposite) to 0-100%.
 */
function distanceToPercent(distance) {
  return Math.round(Math.max(0, Math.min(100, (1 - distance / 2) * 100)));
}

function formatFollowers(count) {
  if (!count) return '0';
  return count >= 1000 ? `${Math.round(count / 1000)}K` : `${count}`;
}

// ─── Target table configurations ──────────────────────────────────────────────

const TARGET_CONFIGS = {
  CreatorProfile: {
    table: 'CreatorProfile',
    rpcName: 'match_creators',
    selectColumns:
      'id, display_name, niches, ai_tags, follower_count, engagement_rate, avatar_url, owner_user_id, embedding',
    hydrateColumns:
      'id, display_name, niches, ai_tags, follower_count, engagement_rate, avatar_url, owner_user_id',
    hasProfileFields: (row) => row.display_name !== undefined,
    normalize: (row, matchPercent) => ({
      id: row.id,
      name: row.display_name || 'Anonymous Creator',
      avatar: row.avatar_url || FALLBACK_AVATAR,
      owner_user_id: row.owner_user_id,
      niches: Array.isArray(row.niches) ? row.niches : (row.niches ? [row.niches] : []),
      ai_tags: Array.isArray(row.ai_tags) ? row.ai_tags : [],
      followers: formatFollowers(row.follower_count),
      follower_count: row.follower_count || 0,
      engagementRate: `${row.engagement_rate || 0}%`,
      engagement_rate: row.engagement_rate || 0,
      matchPercent,
      compatibility: matchPercent,
    }),
  },
  BrandProfile: {
    table: 'BrandProfile',
    rpcName: 'match_brands',
    selectColumns:
      'id, brand_name, category, location, description, ai_tags, logo_url, rating_avg, review_count, owner_user_id, embedding',
    hydrateColumns:
      'id, brand_name, category, location, description, ai_tags, logo_url, rating_avg, review_count, owner_user_id',
    hasProfileFields: (row) => row.brand_name !== undefined,
    normalize: (row, matchPercent) => ({
      ...toBrandCard(row),
      description: row.description || '',
      ai_tags: Array.isArray(row.ai_tags) ? row.ai_tags : [],
      matchPercent,
      compatibility: matchPercent,
    }),
  },
};

function resolveTargetConfig(targetTable) {
  if (targetTable === 'CreatorProfile' || targetTable === 'creators') {
    return TARGET_CONFIGS.CreatorProfile;
  }
  if (targetTable === 'BrandProfile' || targetTable === 'brands') {
    return TARGET_CONFIGS.BrandProfile;
  }
  throw new Error(`Unsupported match targetTable: ${targetTable}`);
}

// ─── Creator embedding auto-update helper ─────────────────────────────────────

export function buildCreatorEmbeddingText(creator) {
  const niches = Array.isArray(creator.niches) ? creator.niches.join(', ') : (creator.niches || '');
  const tags = Array.isArray(creator.ai_tags) ? creator.ai_tags.join(', ') : (creator.ai_tags || '');
  const bio = creator.bio || '';
  return `Niches: ${niches}. Tags: ${tags}. Bio: ${bio}`.trim();
}

export async function updateCreatorEmbedding(creatorId, creator) {
  try {
    const text = buildCreatorEmbeddingText(creator);
    if (!text || text === 'Niches: . Tags: . Bio:') return;
    const embedding = await getGeminiEmbedding(text);
    const { error } = await supabaseAdmin
      .from('CreatorProfile')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', creatorId);
    if (error) {
      console.error('updateCreatorEmbedding DB error:', error.message);
    }
  } catch (err) {
    console.error('updateCreatorEmbedding failed (non-fatal):', err.message);
  }
}

// ─── Single consolidated embedding matcher ────────────────────────────────────

/**
 * Matches a pre-computed embedding vector against `targetTable` via pgvector RPC
 * (`match_creators` or `match_brands`) with automatic hydration, excludeIds filtering,
 * and JS cosine fallback. Returns normalized rows sorted by `matchPercent` desc.
 *
 * @param {number[]} queryVector
 * @param {'CreatorProfile'|'BrandProfile'} targetTable
 * @param {{ limit?: number, excludeIds?: string[] }} [options]
 * @returns {Promise<Array>}
 */
export async function matchByVector(queryVector, targetTable, { limit = 10, excludeIds = [] } = {}) {
  const config = resolveTargetConfig(targetTable);
  const excludeSet = new Set(excludeIds || []);
  const fetchCount = limit + excludeSet.size;

  // 1. Prefer pgvector RPC (DB-side cosine distance)
  const { data: rpcResults, error: rpcError } = await supabaseAdmin.rpc(
    config.rpcName,
    { query_embedding: queryVector, match_count: fetchCount }
  );

  if (!rpcError && Array.isArray(rpcResults) && rpcResults.length > 0) {
    const filteredRpc = rpcResults.filter((r) => !excludeSet.has(r.id)).slice(0, limit);
    if (filteredRpc.length > 0) {
      if (!config.hasProfileFields(filteredRpc[0])) {
        const ids = filteredRpc.map((r) => r.id);
        const { data: hydratedRows, error: hydrateError } = await supabaseAdmin
          .from(config.table)
          .select(config.hydrateColumns)
          .in('id', ids);

        if (!hydrateError && hydratedRows) {
          const byId = new Map(hydratedRows.map((r) => [r.id, r]));
          return filteredRpc
            .map((rpcRow) => {
              const full = byId.get(rpcRow.id);
              if (!full) return null;
              return config.normalize(full, distanceToPercent(rpcRow.distance));
            })
            .filter(Boolean);
        }
      } else {
        return filteredRpc.map((row) =>
          config.normalize(row, distanceToPercent(row.distance))
        );
      }
    }
  }

  if (rpcError) {
    console.warn(`${config.rpcName} RPC unavailable, falling back to JS cosine:`, rpcError.message);
  }

  // 2. Fallback: JS cosine similarity over stored embeddings
  const { data: rows, error: rowsError } = await supabaseAdmin
    .from(config.table)
    .select(config.selectColumns);

  if (rowsError) {
    throw new Error(`Failed to fetch ${config.table}: ${rowsError.message}`);
  }

  const scored = (rows || [])
    .filter((row) => !excludeSet.has(row.id))
    .map((row) => {
      let matchPercent = 50;
      if (row.embedding) {
        const vec = parseVector(row.embedding);
        if (vec && vec.length === queryVector.length) {
          matchPercent = Math.round(
            Math.max(0, Math.min(100, cosineSimilarity(queryVector, vec) * 100))
          );
        }
      }
      return config.normalize(row, matchPercent);
    });

  return scored.sort((a, b) => b.matchPercent - a.matchPercent).slice(0, limit);
}

/**
 * Embeds `queryText` via lib/gemini.js, then delegates to `matchByVector`.
 *
 * @param {string} queryText
 * @param {'CreatorProfile'|'BrandProfile'} targetTable
 * @param {{ limit?: number, excludeIds?: string[] }} [options]
 * @returns {Promise<Array>}
 */
export async function matchByEmbedding(queryText, targetTable, options = {}) {
  const queryVector = await getGeminiEmbedding(queryText);
  return matchByVector(queryVector, targetTable, options);
}
