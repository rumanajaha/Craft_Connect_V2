import { NextResponse } from "next/server";
import { getSupabaseRouteClient } from "@/lib/supabaseRouteHandler";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request, { params }) {
  try {
    const { id } = params;

    const supabase = getSupabaseRouteClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a participant of this thread
    const { data: thread, error: threadError } = await supabaseAdmin
      .from("MessageThread")
      .select("id, participant_a_id, participant_b_id")
      .eq("id", id)
      .maybeSingle();

    if (threadError || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.participant_a_id !== user.id && thread.participant_b_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Upsert the clear state — set cleared_before to now()
    const now = new Date().toISOString();
    const { error: upsertError } = await supabaseAdmin
      .from("ThreadClearState")
      .upsert(
        {
          user_id: user.id,
          thread_id: id,
          cleared_before: now,
        },
        { onConflict: "user_id,thread_id" }
      );

    if (upsertError) {
      console.error("POST /api/messages/[id]/clear upsert error:", upsertError);
      return NextResponse.json({ error: "Failed to clear chat" }, { status: 500 });
    }

    return NextResponse.json({ success: true, cleared_before: now });
  } catch (err) {
    console.error("POST /api/messages/[id]/clear error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
