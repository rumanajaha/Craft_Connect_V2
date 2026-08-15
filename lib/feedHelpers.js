import { supabaseAdmin } from './supabaseServer';
import { getGeminiEmbedding } from './gemini';

// ─── Embedding text builders ───────────────────────────────────────────────────

/**
 * Builds the text to embed for a Product row.
 * Combines name + description + category.
 */
export function buildProductEmbeddingText(product) {
  const parts = [
    product.name ? `Product: ${product.name}` : '',
    product.category ? `Category: ${product.category}` : '',
    product.description ? `Description: ${product.description}` : '',
  ].filter(Boolean);
  return parts.join('. ').trim();
}

/**
 * Builds the text to embed for a PortfolioItem row.
 * Combines title + description.
 */
export function buildPortfolioEmbeddingText(item) {
  const parts = [
    item.title ? `Title: ${item.title}` : '',
    item.description ? `Description: ${item.description}` : '',
  ].filter(Boolean);
  return parts.join('. ').trim();
}

/**
 * Builds the viewer query text from a brand's profile tags.
 * Used as the embedding query when ranking the feed for a brand.
 */
export function buildBrandViewerText(brand) {
  const tags = Array.isArray(brand.ai_tags) ? brand.ai_tags.join(', ') : (brand.ai_tags || '');
  const category = brand.category || '';
  return [category ? `Category: ${category}` : '', tags ? `Interests: ${tags}` : '']
    .filter(Boolean).join('. ').trim();
}

/**
 * Builds the viewer query text from a creator's profile.
 * Combines niches + ai_tags.
 */
export function buildCreatorViewerText(creator) {
  const niches = Array.isArray(creator.niches) ? creator.niches.join(', ') : (creator.niches || '');
  const tags = Array.isArray(creator.ai_tags) ? creator.ai_tags.join(', ') : (creator.ai_tags || '');
  return [niches ? `Niches: ${niches}` : '', tags ? `Tags: ${tags}` : '']
    .filter(Boolean).join('. ').trim();
}

// ─── Auto-update helpers (fire-and-forget) ────────────────────────────────────

/**
 * Regenerate and store the embedding for a Product row.
 * Non-blocking — never throws; logs errors only.
 */
export async function updateProductEmbedding(productId, product) {
  try {
    const text = buildProductEmbeddingText(product);
    if (!text) return;
    const embedding = await getGeminiEmbedding(text);
    const { error } = await supabaseAdmin
      .from('Product')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', productId);
    if (error) console.error('updateProductEmbedding DB error:', error.message);
  } catch (err) {
    console.error('updateProductEmbedding failed (non-fatal):', err.message);
  }
}

/**
 * Regenerate and store the embedding for a PortfolioItem row.
 * Non-blocking — never throws; logs errors only.
 */
export async function updatePortfolioEmbedding(itemId, item) {
  try {
    const text = buildPortfolioEmbeddingText(item);
    if (!text) return;
    const embedding = await getGeminiEmbedding(text);
    const { error } = await supabaseAdmin
      .from('PortfolioItem')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', itemId);
    if (error) console.error('updatePortfolioEmbedding DB error:', error.message);
  } catch (err) {
    console.error('updatePortfolioEmbedding failed (non-fatal):', err.message);
  }
}

// ─── Feed ranking with embedding similarity ────────────────────────────────────

/**
 * Parse a pgvector value from the DB (stored as JSON string or plain array).
 */
function parseVector(val) {
  if (!val) return null;
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return val.replace(/[\[\]]/g, '').split(',').map(Number); } catch { return null; }
  }
  return null;
}

/**
 * Cosine similarity between two equal-length numeric arrays.
 * Returns a value in [0, 1].
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Tag-overlap fallback (same formula as before).
 */
function getTagOverlap(userTags, itemTags) {
  if (!userTags?.length || !itemTags?.length) return 0;
  const userSet = new Set(userTags.map(t => t.toLowerCase().trim()).filter(Boolean));
  const count = itemTags.filter(t => userSet.has(t.toLowerCase().trim())).length;
  return count / Math.max(1, userSet.size);
}

/**
 * Recency decay: exponential half-life of ~10 days.
 */
function getRecencyDecay(createdAt) {
  const ageInDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-0.1 * Math.max(0, ageInDays));
}

/**
 * Score a merged feed item list using embedding cosine similarity when available,
 * falling back to tag overlap.
 *
 * Weights (unchanged from original):
 *   brand:   40% affinity + 10% recency + 50% engagement
 *   creator: 40% affinity + 10% recency + 50% engagement
 *
 * @param {Array}   items          - Merged product + portfolio items (already fetched).
 * @param {string}  viewerText     - Text representing the viewer's interests (to embed).
 * @param {Array}   viewerTags     - Fallback tag array if embedding unavailable.
 * @returns {Promise<Array>}       - Items sorted by score desc, with `score` and `matchesStyle`.
 */
export async function rankFeedByEmbedding(items, viewerText, viewerTags = []) {
  if (!items || items.length === 0) return [];

  // Compute max engagement for normalisation
  let maxEngagement = 1;
  items.forEach(item => {
    const eng = (item.views || 0) + (item.saves || 0) * 5;
    if (eng > maxEngagement) maxEngagement = eng;
  });

  // Try to get viewer embedding — fall back gracefully if Gemini unavailable
  let viewerVec = null;
  if (viewerText) {
    try {
      viewerVec = await getGeminiEmbedding(viewerText);
    } catch (err) {
      console.warn('Feed ranking: viewer embedding failed, falling back to tag overlap:', err.message);
    }
  }

  return items
    .map(item => {
      const recencyDecay = getRecencyDecay(item.created_at);
      const rawEngagement = (item.views || 0) + (item.saves || 0) * 5;
      const engagementNorm = rawEngagement / maxEngagement;

      // Affinity: embedding similarity preferred, tag overlap as fallback
      let affinity = 0;
      if (viewerVec && item._embedding) {
        const itemVec = parseVector(item._embedding);
        if (itemVec && itemVec.length === viewerVec.length) {
          affinity = cosineSimilarity(viewerVec, itemVec);
        } else {
          // Item has no embedding yet — use tag overlap
          affinity = getTagOverlap(viewerTags, item.ai_tags);
        }
      } else {
        affinity = getTagOverlap(viewerTags, item.ai_tags);
      }

      const score = (0.4 * affinity) + (0.1 * recencyDecay) + (0.5 * engagementNorm);

      return {
        ...item,
        _embedding: undefined, // strip internal field before sending to client
        score,
        matchesStyle: affinity > 0.6
      };
    })
    .sort((a, b) => b.score - a.score);
}
