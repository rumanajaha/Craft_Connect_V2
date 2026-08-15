-- ============================================================
-- CraftConnect: Embedding Dimension Fix Migration
-- Run this ONCE in Supabase SQL Editor.
--
-- Background: gemini-embedding-001 and gemini-embedding-2 both
-- produce 3072-dimensional vectors. All embedding columns were
-- originally declared as vector(768) (designed for text-embedding-004,
-- which is not available on this API key). This script widens every
-- embedding column to vector(3072) and drops any stale data.
-- ============================================================

-- Drop existing HNSW/IVFFlat indexes if any (they're dimension-specific)
DROP INDEX IF EXISTS creator_embedding_idx;
DROP INDEX IF EXISTS brand_embedding_idx;
DROP INDEX IF EXISTS product_embedding_idx;
DROP INDEX IF EXISTS portfolio_embedding_idx;

-- Widen CreatorProfile.embedding
ALTER TABLE "CreatorProfile"
  ALTER COLUMN embedding TYPE vector(3072)
  USING NULL;   -- clear stale 768-d data; backfill will regenerate

-- Widen BrandProfile.embedding (if column exists)
ALTER TABLE "BrandProfile"
  ALTER COLUMN embedding TYPE vector(3072)
  USING NULL;

-- Add / widen Product.embedding
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS embedding vector(3072);

ALTER TABLE "Product"
  ALTER COLUMN embedding TYPE vector(3072)
  USING NULL;

-- Add / widen PortfolioItem.embedding
ALTER TABLE "PortfolioItem"
  ADD COLUMN IF NOT EXISTS embedding vector(3072);

ALTER TABLE "PortfolioItem"
  ALTER COLUMN embedding TYPE vector(3072)
  USING NULL;

-- Rebuild pgvector RPC functions for CreatorProfile (match_creators)
-- Drop and recreate with the correct dimension
DROP FUNCTION IF EXISTS match_creators(vector, integer);
CREATE OR REPLACE FUNCTION match_creators(query_embedding vector(3072), match_count integer)
RETURNS TABLE (
  id uuid,
  distance float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    embedding <=> query_embedding AS distance
  FROM "CreatorProfile"
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Rebuild pgvector RPC functions for BrandProfile (match_brands)
DROP FUNCTION IF EXISTS match_brands(vector, integer);
CREATE OR REPLACE FUNCTION match_brands(query_embedding vector(3072), match_count integer)
RETURNS TABLE (
  id uuid,
  distance float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    embedding <=> query_embedding AS distance
  FROM "BrandProfile"
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Done. Run all backfill scripts next:
--   node scripts/backfill-creator-embeddings.js
--   node scripts/backfill-feed-embeddings.js
