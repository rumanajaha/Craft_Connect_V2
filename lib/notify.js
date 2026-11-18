import { supabaseAdmin } from "@/lib/supabaseServer";

/**
 * Maps notification `type` values to preference keys across
 * CustomerProfile, BrandProfile, and CreatorProfile `notification_prefs`.
 */
export const NOTIFICATION_PREF_KEYS = {
  new_message: ["newMessage", "messages"],
  message_request: ["newMessage", "messages", "newRequest"],
  custom_request: ["newRequest"],
  request_responded: ["brandResponse", "requestStatus"],
  request_accepted: ["requestStatus", "newMessage", "messages"],
  collab_pitch: ["newPitch", "brandMatchFound", "pitchResponse"],
  pitch_status: ["pitchResponse", "newPitch"],
  ai_match: ["aiMatch", "brandMatchFound"],
  product_status: ["productStatus"],
  ai_limit: ["aiLimit"],
};

async function getRecipientNotificationPrefs(userId) {
  if (!userId) return null;
  const [brandRes, creatorRes, customerRes] = await Promise.all([
    supabaseAdmin
      .from("BrandProfile")
      .select("notification_prefs")
      .eq("owner_user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("CreatorProfile")
      .select("notification_prefs")
      .eq("owner_user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("CustomerProfile")
      .select("notification_prefs")
      .eq("owner_user_id", userId)
      .maybeSingle(),
  ]);

  return (
    brandRes.data?.notification_prefs ||
    creatorRes.data?.notification_prefs ||
    customerRes.data?.notification_prefs ||
    null
  );
}

/**
 * Returns false only when the recipient explicitly disabled notification delivery
 * for the matching preference key (both desktop & email turned off, or boolean false).
 */
export function isNotificationEnabledForPrefs(type, prefs) {
  if (!prefs || typeof prefs !== "object") return true;
  const candidateKeys = NOTIFICATION_PREF_KEYS[type];
  if (!candidateKeys) return true;

  for (const key of candidateKeys) {
    if (!(key in prefs)) continue;
    const entry = prefs[key];
    if (entry === false) return false;
    if (entry && typeof entry === "object") {
      if (entry.desktop === false && entry.email === false) {
        return false;
      }
      return true;
    }
  }
  return true;
}

/**
 * Resolves a real human-readable sender name for any userId across BrandProfile,
 * CreatorProfile, CustomerProfile, and auth user metadata/email. Never returns "Someone".
 */
export async function resolveSenderName(userId, fallbackEmail = "") {
  if (userId) {
    const [brandRes, creatorRes, customerRes] = await Promise.all([
      supabaseAdmin
        .from("BrandProfile")
        .select("brand_name")
        .eq("owner_user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("CreatorProfile")
        .select("display_name")
        .eq("owner_user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("CustomerProfile")
        .select("display_name")
        .eq("owner_user_id", userId)
        .maybeSingle(),
    ]);

    const name =
      brandRes.data?.brand_name?.trim() ||
      creatorRes.data?.display_name?.trim() ||
      customerRes.data?.display_name?.trim();
    if (name) return name;

    try {
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
      const authUser = authData?.user;
      const metaName =
        authUser?.user_metadata?.full_name?.trim() ||
        authUser?.user_metadata?.name?.trim();
      if (metaName) return metaName;
      if (authUser?.email) return authUser.email.split("@")[0];
    } catch (_) {}
  }

  if (fallbackEmail && typeof fallbackEmail === "string" && fallbackEmail.includes("@")) {
    return fallbackEmail.split("@")[0];
  }
  return "CraftConnect User";
}

/**
 * Single centralized helper for all Notification inserts.
 * Respects recipient's `notification_prefs` before inserting.
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  relatedEntityId = null,
  link = null,
}) {
  if (!userId || !type || !title) {
    console.warn("createNotification skipped: missing userId, type, or title");
    return { skipped: true };
  }

  try {
    const prefs = await getRecipientNotificationPrefs(userId);
    if (!isNotificationEnabledForPrefs(type, prefs)) {
      return { skipped: true, reason: "disabled_by_prefs" };
    }
  } catch (prefErr) {
    console.warn("Notification pref check failed (proceeding):", prefErr.message);
  }

  const { error } = await supabaseAdmin.from("Notification").insert({
    user_id: userId,
    type,
    title,
    body,
    related_entity_id: relatedEntityId,
    link,
    is_read: false,
  });

  if (error) {
    console.error("Failed to create notification:", error.message);
    return { error };
  }
  return { inserted: true };
}
