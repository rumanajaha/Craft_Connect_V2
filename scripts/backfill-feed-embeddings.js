/**
 * scripts/backfill-feed-embeddings.js
 *
 * One-off backfill: generates embeddings for all existing Product and
 * PortfolioItem rows that don't have one yet.
 *
 * Usage (from project root):
 *   node scripts/backfill-feed-embeddings.js
 *
 * Requires:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - GEMINI_API_KEY
 * in .env.local (loaded via dotenv below).
 *
 * Rate-limiting: waits 200ms between each Gemini call to stay
 * comfortably inside the free-tier quota.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Product ──────────────────────────────────────────────────────────────────

async function backfillProducts() {
  console.log('\n── Backfilling Product embeddings ──');

  const { data: products, error } = await supabase
    .from('Product')
    .select('id, name, category, description')
    .is('embedding', null);

  if (error) {
    console.error('Failed to fetch products:', error.message);
    return;
  }

  console.log(`Found ${products.length} Products missing embeddings.`);
  let ok = 0, fail = 0;

  for (const p of products) {
    const parts = [
      p.name ? `Product: ${p.name}` : '',
      p.category ? `Category: ${p.category}` : '',
      p.description ? `Description: ${p.description}` : '',
    ].filter(Boolean);

    const text = parts.join('. ').trim();
    if (!text) { fail++; continue; }

    try {
      const embedding = await getEmbedding(text);
      const { error: upErr } = await supabase
        .from('Product')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', p.id);

      if (upErr) { console.error(`  Product ${p.id}: update error:`, upErr.message); fail++; }
      else { console.log(`  ✓ Product ${p.id} (${p.name})`); ok++; }
    } catch (err) {
      console.error(`  ✗ Product ${p.id} (${p.name}):`, err.message);
      fail++;
    }

    await sleep(200);
  }

  console.log(`Products done: ${ok} succeeded, ${fail} failed.`);
}

// ─── PortfolioItem ────────────────────────────────────────────────────────────

async function backfillPortfolioItems() {
  console.log('\n── Backfilling PortfolioItem embeddings ──');

  const { data: items, error } = await supabase
    .from('PortfolioItem')
    .select('id, title, description')
    .is('embedding', null);

  if (error) {
    console.error('Failed to fetch portfolio items:', error.message);
    return;
  }

  console.log(`Found ${items.length} PortfolioItems missing embeddings.`);
  let ok = 0, fail = 0;

  for (const item of items) {
    const parts = [
      item.title ? `Title: ${item.title}` : '',
      item.description ? `Description: ${item.description}` : '',
    ].filter(Boolean);

    const text = parts.join('. ').trim();
    if (!text) { fail++; continue; }

    try {
      const embedding = await getEmbedding(text);
      const { error: upErr } = await supabase
        .from('PortfolioItem')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', item.id);

      if (upErr) { console.error(`  PortfolioItem ${item.id}: update error:`, upErr.message); fail++; }
      else { console.log(`  ✓ PortfolioItem ${item.id} (${item.title})`); ok++; }
    } catch (err) {
      console.error(`  ✗ PortfolioItem ${item.id} (${item.title}):`, err.message);
      fail++;
    }

    await sleep(200);
  }

  console.log(`PortfolioItems done: ${ok} succeeded, ${fail} failed.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('CraftConnect — Feed Embedding Backfill');
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  await backfillProducts();
  await backfillPortfolioItems();
  console.log('\nBackfill complete.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
