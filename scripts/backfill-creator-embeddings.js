#!/usr/bin/env node
/**
 * scripts/backfill-creator-embeddings.js
 *
 * One-off script to generate and store embeddings for all existing
 * CreatorProfile rows that are missing an embedding.
 *
 * Run once:
 *   node scripts/backfill-creator-embeddings.js
 *
 * Going forward, embeddings are regenerated automatically on every
 * profile PATCH that changes niches, ai_tags, or bio.
 */

// Load env vars from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
  console.error('Missing environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and GEMINI_API_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function buildEmbeddingText(creator) {
  const niches = Array.isArray(creator.niches) ? creator.niches.join(', ') : (creator.niches || '');
  const tags = Array.isArray(creator.ai_tags) ? creator.ai_tags.join(', ') : (creator.ai_tags || '');
  const bio = creator.bio || '';
  return `Niches: ${niches}. Tags: ${tags}. Bio: ${bio}`.trim();
}

let geminiModulePromise;
async function getEmbedding(text) {
  if (!geminiModulePromise) {
    geminiModulePromise = import('../lib/gemini.js');
  }
  const { getGeminiEmbedding } = await geminiModulePromise;
  return getGeminiEmbedding(text);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Fetching all creator profiles...');

  // Fetch creators missing an embedding
  const { data: creators, error } = await supabase
    .from('CreatorProfile')
    .select('id, display_name, niches, ai_tags, bio, embedding')
    .is('embedding', null);

  if (error) {
    console.error('Failed to fetch creators:', error.message);
    process.exit(1);
  }

  console.log(`Found ${creators.length} creator(s) with missing embeddings.\n`);

  if (creators.length === 0) {
    console.log('All creators already have embeddings. Nothing to do.');
    return;
  }

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const creator of creators) {
    const text = buildEmbeddingText(creator);
    const name = creator.display_name || creator.id;

    if (!text || text === 'Niches: . Tags: . Bio:') {
      console.log(`  [SKIP] ${name} — no content to embed`);
      skipped++;
      continue;
    }

    try {
      const embedding = await getEmbedding(text);

      const { error: updateError } = await supabase
        .from('CreatorProfile')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', creator.id);

      if (updateError) {
        console.error(`  [FAIL] ${name} — DB update error: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  [OK]   ${name} — embedding stored (${embedding.length}d)`);
        success++;
      }
    } catch (err) {
      console.error(`  [FAIL] ${name} — ${err.message}`);
      failed++;
    }

    // Rate limit: ~60 req/min for embedding API, be conservative
    await sleep(1100);
  }

  console.log(`\nDone. Success: ${success} | Skipped: ${skipped} | Failed: ${failed}`);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
