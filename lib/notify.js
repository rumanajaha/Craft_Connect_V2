import { supabaseAdmin } from "@/lib/supabaseServer";

export async function createNotification({ userId, type, title, body, relatedEntityId, link }) {
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
  }
}
