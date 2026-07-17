import { supabaseAdmin } from "@/lib/supabaseServer";

export async function findOrCreateThread(user1Id, user2Id) {
  // Check both directions for existing thread
  const { data: existingThread, error: findError } = await supabaseAdmin
    .from("MessageThread")
    .select("id")
    .or(`and(participant_a_id.eq.${user1Id},participant_b_id.eq.${user2Id}),and(participant_a_id.eq.${user2Id},participant_b_id.eq.${user1Id})`)
    .maybeSingle();

  if (findError) {
    console.error("Error finding MessageThread:", findError);
    throw findError;
  }

  if (existingThread) {
    return existingThread.id;
  }

  // Create new thread with canonical ordering (smaller UUID first)
  const pA = user1Id < user2Id ? user1Id : user2Id;
  const pB = user1Id < user2Id ? user2Id : user1Id;

  const { data: newThread, error: createError } = await supabaseAdmin
    .from("MessageThread")
    .insert({
      participant_a_id: pA,
      participant_b_id: pB,
      last_message_at: new Date().toISOString(),
      status: "pending",
      initiated_by: user1Id,
    })
    .select()
    .single();

  if (createError) {
    // Handle race condition: unique constraint violation means thread was just created
    if (createError.code === "23505") {
      const { data: raceThread, error: raceError } = await supabaseAdmin
        .from("MessageThread")
        .select("id")
        .or(`and(participant_a_id.eq.${user1Id},participant_b_id.eq.${user2Id}),and(participant_a_id.eq.${user2Id},participant_b_id.eq.${user1Id})`)
        .maybeSingle();
      if (raceError) {
        throw raceError;
      }
      if (raceThread) {
        return raceThread.id;
      }
    }
    console.error("Error creating MessageThread:", createError);
    throw createError;
  }

  return newThread.id;
}
