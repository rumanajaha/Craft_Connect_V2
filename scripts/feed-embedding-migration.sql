-- ============================================================
-- CraftConnect: Feed Embedding Migration
-- Run this once in Supabase SQL Editor (or via psql).
-- Requires: pgvector extension already enabled (it is, from
-- CreatorProfile / BrandProfile embedding setup).
-- ============================================================

-- 1. Add embedding column to Product
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS embedding vector(3072);

-- 2. Add embedding column to PortfolioItem
ALTER TABLE "PortfolioItem"
  ADD COLUMN IF NOT EXISTS embedding vector(3072);

-- 3. Optional: HNSW indexes for fast cosine distance queries
--    (Only needed if you later build DB-side feed ranking RPCs.
--     The current JS-side cosine similarity doesn't require indexes.)
-- CREATE INDEX IF NOT EXISTS product_embedding_idx
--   ON "Product" USING hnsw (embedding vector_cosine_ops);
-- CREATE INDEX IF NOT EXISTS portfolio_embedding_idx
--   ON "PortfolioItem" USING hnsw (embedding vector_cosine_ops);

-- Done. Run scripts/backfill-feed-embeddings.js next.
