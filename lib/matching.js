import { supabaseAdmin } from './supabaseServer';
import { getGeminiEmbedding } from './gemini';

// ─── Shared helpers ───────────────────────────────────────────────────────────

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

/**
 * Convert pgvector cosine distance (0 = identical, 2 = opposite) to a 0-100 score.
 */
function distanceToScore(distance) {
  return Math.round(Math.max(0, (1 - distance / 2)) * 100);
}

// ─── Core matching function ───────────────────────────────────────────────────

/**
 * Embed `queryText` with text-embedding-004, then find the closest rows in
 * `table` ordered by cosine distance using the pgvector `<=>` operator via
 * a Supabase RPC.  Falls back to JavaScript cosine similarity when the RPC is
 * not yet deployed.
 *
 * @param {object} opts
 * @param {string}   opts.queryText       - The search string to embed.
 * @param {string}   opts.table           - 'CreatorProfile' or 'BrandProfile'.
 * @param {string}   opts.rpcName         - Supabase RPC function name (e.g. 'match_creators').
 * @param {string}   opts.selectColumns   - Supabase select string for the fallback query.
 * @param {function} opts.mapRow          - Maps a DB row → the result shape your caller needs.
 * @param {number}   [opts.limit=10]      - Max results to return.
 * @returns {Promise<Array>}
 */
export async function matchByEmbedding({ queryText, table, rpcName, selectColumns, mapRow, limit = 10 }) {
  const queryVector = await getGeminiEmbedding(queryText);

  // ── Prefer pgvector RPC (DB-side, index-accelerated) ──────────────────────
  const { data: rpcResults, error: rpcError } = await supabaseAdmin
    .rpc(rpcName, { query_embedding: queryVector, match_count: limit });

  if (!rpcError && rpcResults) {
    return rpcResults.map(row => mapRow(row, distanceToScore(row.distance)));
  }

  if (rpcError) {
    console.warn(`${rpcName} RPC unavailable, falling back to JS cosine:`, rpcError.message);
  }

  // ── Fallback: JS cosine similarity ────────────────────────────────────────
  const { data: rows, error: rowsError } = await supabaseAdmin
    .from(table)
    .select(selectColumns);

  if (rowsError) {
    throw new Error(`Failed to fetch ${table}: ${rowsError.message}`);
  }

  const scored = (rows || []).map(row => {
    let score = 50; // neutral for missing embeddings
    if (row.embedding) {
      const vec = parseVector(row.embedding);
      if (vec && vec.length === queryVector.length) {
        score = Math.round(Math.max(0, Math.min(100, cosineSimilarity(queryVector, vec) * 100)));
      }
    }
    return mapRow(row, score);
  });

  return scored.sort((a, b) => b.compatibility - a.compatibility).slice(0, limit);
}
