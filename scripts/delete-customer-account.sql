-- ============================================================
-- CraftConnect: delete_customer_account(user_id uuid)
-- Run once in Supabase SQL Editor.
-- Atomically removes SavedBrand, CustomRequest, Rating,
-- Notification, and CustomerProfile rows for a customer
-- before the API deletes the auth.users record.
-- ============================================================

CREATE OR REPLACE FUNCTION delete_customer_account(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id uuid;
BEGIN
  SELECT id INTO v_customer_id
  FROM "CustomerProfile"
  WHERE owner_user_id = delete_customer_account.user_id;

  -- 1. Saved brands (keyed by CustomerProfile.id)
  IF v_customer_id IS NOT NULL AND to_regclass('public."SavedBrand"') IS NOT NULL THEN
    DELETE FROM "SavedBrand"
    WHERE customer_id = v_customer_id;
  END IF;

  -- 2. Custom requests (keyed by CustomerProfile.id)
  IF v_customer_id IS NOT NULL AND to_regclass('public."CustomRequest"') IS NOT NULL THEN
    DELETE FROM "CustomRequest"
    WHERE customer_id = v_customer_id;
  END IF;

  -- 3. Ratings (keyed by CustomerProfile.id)
  IF v_customer_id IS NOT NULL AND to_regclass('public."Rating"') IS NOT NULL THEN
    DELETE FROM "Rating"
    WHERE customer_id = v_customer_id;
  END IF;

  -- 4. Notifications
  IF to_regclass('public."Notification"') IS NOT NULL THEN
    DELETE FROM "Notification"
    WHERE "Notification".user_id = delete_customer_account.user_id;
  END IF;

  -- 5. Customer profile row
  DELETE FROM "CustomerProfile"
  WHERE owner_user_id = delete_customer_account.user_id;
END;
$$;

