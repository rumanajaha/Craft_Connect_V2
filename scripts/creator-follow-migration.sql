-- ============================================================
-- CraftConnect: Real Creator Followers ("CreatorFollow")
-- Tracks actual platform users following each CreatorProfile
-- and keeps CreatorProfile.follower_count synced with real rows.
-- ============================================================

CREATE TABLE IF NOT EXISTS "CreatorFollow" (
  creator_id uuid NOT NULL REFERENCES "CreatorProfile"(id) ON DELETE CASCADE,
  follower_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (creator_id, follower_user_id)
);

CREATE INDEX IF NOT EXISTS creator_follow_creator_idx ON "CreatorFollow" (creator_id);
CREATE INDEX IF NOT EXISTS creator_follow_user_idx ON "CreatorFollow" (follower_user_id);

ALTER TABLE "CreatorFollow" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view creator follows" ON "CreatorFollow";
CREATE POLICY "Authenticated users can view creator follows"
ON "CreatorFollow"
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can follow creators" ON "CreatorFollow";
CREATE POLICY "Users can follow creators"
ON "CreatorFollow"
FOR INSERT
TO authenticated
WITH CHECK (follower_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can unfollow creators" ON "CreatorFollow";
CREATE POLICY "Users can unfollow creators"
ON "CreatorFollow"
FOR DELETE
TO authenticated
USING (follower_user_id = auth.uid());

-- Sync existing CreatorProfile.follower_count to real follow counts (replaces mock/manual numbers)
UPDATE "CreatorProfile" cp
SET follower_count = COALESCE(
  (SELECT COUNT(*)::int FROM "CreatorFollow" cf WHERE cf.creator_id = cp.id),
  0
);

