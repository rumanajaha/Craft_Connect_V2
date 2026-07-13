import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

// GET /api/brand/messages/[id] - Fetch full thread message history
export async function GET(request, { params }) {
  try {
    const { id } = params;

    // 1. Authenticate user using JWT from Authorization or cookies
    const authHeader = request.headers.get("Authorization");
    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      const cookieHeader = request.headers.get("cookie") || "";
      const tokenCookie = cookieHeader
        .split(";")
        .find((c) => c.trim().startsWith("sb-access-token="));
      if (tokenCookie) {
        token = tokenCookie.split("=")[1];
      }
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch the thread and verify ownership
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

    // Check if the other participant is a Creator
    const { data: creatorProfile } = await supabaseAdmin
      .from("CreatorProfile")
      .select("id")
      .eq("owner_user_id", otherId)
      .maybeSingle();

    const isCreatorThread = !!creatorProfile;

    // 3. Fetch all messages in this thread ordered by created_at ascending
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from("Message")
      .select("*")
      .eq("thread_id", id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const formattedMessages = messages.map((msg) => {
      let sender = "customer";
      if (msg.sender_id === user.id) {
        sender = "brand";
      } else if (isCreatorThread) {
        sender = "creator";
      }
      return {
        id: msg.id,
        sender,
        text: msg.body,
        image: msg.attachment_url || null,
        timestamp: msg.created_at
      };
    });

    return NextResponse.json({ messages: formattedMessages });
  } catch (err) {
    console.error("GET /api/brand/messages/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/brand/messages/[id] - Send a message to a thread
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { text, image } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    // 1. Authenticate user using JWT from Authorization or cookies
    const authHeader = request.headers.get("Authorization");
    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      const cookieHeader = request.headers.get("cookie") || "";
      const tokenCookie = cookieHeader
        .split(";")
        .find((c) => c.trim().startsWith("sb-access-token="));
      if (tokenCookie) {
        token = tokenCookie.split("=")[1];
      }
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch the thread and verify ownership
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

    // 3. Insert the message row
    const { data: newMsg, error: insertError } = await supabaseAdmin
      .from("Message")
      .insert({
        thread_id: id,
        sender_id: user.id,
        body: text,
        attachment_url: image || null
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting message:", insertError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // 4. Update the thread's last_message_at timestamp
    await supabaseAdmin
      .from("MessageThread")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", id);

    // 5. Send an in-app notification to the recipient
    const bodyText = text.length > 80 ? text.substring(0, 77) + "..." : text;
    await supabaseAdmin
      .from("Notification")
      .insert({
        user_id: otherId,
        type: "message",
        title: "New Message from Brand Owner",
        body: bodyText,
        is_read: false,
        related_entity_id: id
      });

    return NextResponse.json({
      message: {
        id: newMsg.id,
        sender: "brand",
        text: newMsg.body,
        image: newMsg.attachment_url || null,
        timestamp: newMsg.created_at
      }
    });
  } catch (err) {
    console.error("POST /api/brand/messages/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
