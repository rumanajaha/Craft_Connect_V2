-- ============================================================
-- CraftConnect: Add creator_id to AIGeneration (Supabase)
-- Run once in Supabase SQL Editor.
-- Allows Creator AI Studio routes (brand-match, content-ideas,
-- trending-feed, usage) to log and track monthly creator quota.
-- ============================================================

ALTER TABLE "AIGeneration"
  ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES "CreatorProfile"(id) ON DELETE CASCADE,
  ALTER COLUMN brand_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS ai_generation_creator_idx
  ON "AIGeneration" (creator_id, tool_name, created_at);

