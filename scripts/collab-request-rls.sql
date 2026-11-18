-- ============================================================
-- CraftConnect: CollabRequest RLS Policies for Brand Proposals
-- Run once in Supabase SQL Editor.
--
-- Enables:
-- 1. Brand owners can INSERT incoming CollabRequest proposals
--    referencing their own BrandProfile.
-- 2. Creators can UPDATE status on CollabRequest rows targeting
--    their own CreatorProfile (to Accept / Decline proposals).
-- ============================================================

ALTER TABLE "CollabRequest" ENABLE ROW LEVEL SECURITY;

-- Brand owner can insert collaboration proposals for their own brand
DROP POLICY IF EXISTS "Brands can insert collab proposals" ON "CollabRequest";
CREATE POLICY "Brands can insert collab proposals"
ON "CollabRequest"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "BrandProfile" bp
    WHERE bp.id = "CollabRequest".brand_id
      AND bp.owner_user_id = auth.uid()
  )
);

-- Creator can update status on collaboration requests targeting their profile
DROP POLICY IF EXISTS "Creators can update their collab requests" ON "CollabRequest";
CREATE POLICY "Creators can update their collab requests"
ON "CollabRequest"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "CreatorProfile" cp
    WHERE cp.id = "CollabRequest".creator_id
      AND cp.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "CreatorProfile" cp
    WHERE cp.id = "CollabRequest".creator_id
      AND cp.owner_user_id = auth.uid()
  )
);

