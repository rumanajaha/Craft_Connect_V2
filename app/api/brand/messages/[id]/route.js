import { NextResponse } from "next/server";
import { getSupabaseRouteClient } from "@/lib/supabaseRouteHandler";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/brand/messages/[id]
 * Fetch full message history for a specific thread.
 * Role-agnostic: labels messages as "me" or "them" based on sender_id.
 */
export async function GET(request, { params }) {
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
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (threadError || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.participant_a_id !== user.id && thread.participant_b_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all messages in chronological order
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from("Message")
      .select("*")
      .eq("thread_id", id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      sender: msg.sender_id === user.id ? "me" : "them",
      text: msg.body,
      image: msg.attachment_url || null,
      timestamp: msg.created_at,
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (err) {
    console.error("GET /api/brand/messages/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/brand/messages/[id]
 * Send a message to a thread. Role-agnostic.
 */
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { text, image } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    const supabase = getSupabaseRouteClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a participant
    const { data: thread, error: threadError } = await supabaseAdmin
      .from("MessageThread")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (threadError || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.participant_a_id !== user.id && thread.participant_b_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const otherId = thread.participant_a_id === user.id ? thread.participant_b_id : thread.participant_a_id;

    // Insert the message
    const { data: newMsg, error: insertError } = await supabaseAdmin
      .from("Message")
      .insert({
        thread_id: id,
        sender_id: user.id,
        body: text,
        attachment_url: image || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting message:", insertError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Update the thread's last_message_at
    const updateData = { last_message_at: new Date().toISOString() };

    await supabaseAdmin
      .from("MessageThread")
      .update(updateData)
      .eq("id", id);

    // Send in-app notification to recipient
    const bodyText = text.length > 80 ? text.substring(0, 77) + "..." : text;
    await supabaseAdmin
      .from("Notification")
      .insert({
        user_id: otherId,
        type: "message",
        title: "New Message",
        body: bodyText,
        is_read: false,
        related_entity_id: id,
      });

    return NextResponse.json({
      message: {
        id: newMsg.id,
        sender: "me",
        text: newMsg.body,
        image: newMsg.attachment_url || null,
        timestamp: newMsg.created_at,
      },
    });
  } catch (err) {
    console.error("POST /api/brand/messages/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH /api/brand/messages/[id]
 * Update a thread's status (e.g., accepting a message request).
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const supabase = getSupabaseRouteClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a participant
    const { data: thread, error: threadError } = await supabaseAdmin
      .from("MessageThread")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (threadError || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.participant_a_id !== user.id && thread.participant_b_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update the thread
    const { error: updateError } = await supabaseAdmin
      .from("MessageThread")
      .update({ status })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating thread:", updateError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("PATCH /api/brand/messages/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
