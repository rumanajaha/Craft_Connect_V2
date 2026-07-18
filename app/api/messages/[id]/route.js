import { NextResponse } from "next/server";
import { getSupabaseRouteClient } from "@/lib/supabaseRouteHandler";
import { createClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/notify";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/messages/[id]
 * Fetch full message history for a specific thread.
 * Role-agnostic: labels messages as "me" or "them" based on sender_id.
 */
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams || {};

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

    // Check if user has a clear state for this thread
    const { data: clearState } = await supabaseAdmin
      .from("ThreadClearState")
      .select("cleared_before")
      .eq("user_id", user.id)
      .eq("thread_id", id)
      .maybeSingle();

    // Fetch messages, applying cleared_before filter if present
    let messagesQuery = supabaseAdmin
      .from("Message")
      .select("*")
      .eq("thread_id", id)
      .order("created_at", { ascending: true });

    if (clearState?.cleared_before) {
      messagesQuery = messagesQuery.gt("created_at", clearState.cleared_before);
    }

    const { data: messages, error: messagesError } = await messagesQuery;

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const formattedMessages = (messages || []).map((msg) => ({
      id: msg.id,
      sender: msg.sender_id === user.id ? "me" : "them",
      text: msg.body,
      image: msg.attachment_url || null,
      timestamp: msg.created_at,
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (err) {
    console.error("GET /api/messages/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/messages/[id]
 * Send a message to a thread. Role-agnostic.
 */
export async function POST(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams || {};
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

    // 4c. CustomRequest status updates when a brand owner responds (sends a reply)
    if (user.role === "BRANDOWNER") {
      try {
        const { data: brandProf } = await supabaseAdmin
          .from("BrandProfile")
          .select("id, brand_name")
          .eq("owner_user_id", user.id)
          .maybeSingle();

        const { data: customerProf } = await supabaseAdmin
          .from("CustomerProfile")
          .select("id")
          .eq("owner_user_id", otherId)
          .maybeSingle();

        if (brandProf && customerProf) {
          const { data: pendingReq } = await supabaseAdmin
            .from("CustomRequest")
            .select("id")
            .eq("brand_id", brandProf.id)
            .eq("customer_id", customerProf.id)
            .eq("status", "pending")
            .maybeSingle();

          if (pendingReq) {
            await supabaseAdmin
              .from("CustomRequest")
              .update({ status: "responded" })
              .eq("id", pendingReq.id);

            await createNotification({
              userId: otherId,
              type: "request_responded",
              title: "Brand Responded to Request",
              body: `${brandProf.brand_name || 'A Brand'} has responded to your custom request.`,
              relatedEntityId: pendingReq.id,
              link: "/customer/messages"
            });
          }
        }
      } catch (reqErr) {
        console.error("Error updating CustomRequest status upon message reply:", reqErr);
      }
    }

    // Resolve recipient's role/portal
    const [brandRes, creatorRes] = await Promise.all([
      supabaseAdmin.from("BrandProfile").select("id").eq("owner_user_id", otherId).maybeSingle(),
      supabaseAdmin.from("CreatorProfile").select("id").eq("owner_user_id", otherId).maybeSingle(),
    ]);

    let recipientPortal = "customer";
    if (creatorRes.data) {
      recipientPortal = "creator";
    } else if (brandRes.data) {
      recipientPortal = "brand";
    }

    let notifType = "new_message";
    let notifLink = `/${recipientPortal}/messages?thread=${id}`;
    let notifTitle = "New Message";

    if (thread.status === "pending" && thread.initiated_by === user.id) {
      notifType = "message_request";
      notifLink = `/${recipientPortal}/messages?tab=requests&thread=${id}`;
      notifTitle = "New Message Request";
    }

    const bodyText = text.slice(0, 60);

    // Get sender display name
    let senderName = null;
    if (user.role === "BRANDOWNER") {
      const { data: brandProf } = await supabaseAdmin
        .from("BrandProfile")
        .select("brand_name")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (brandProf?.brand_name) {
        senderName = brandProf.brand_name;
      }
    } else if (user.role === "CREATOR") {
      const { data: creatorProf } = await supabaseAdmin
        .from("CreatorProfile")
        .select("display_name")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (creatorProf?.display_name) {
        senderName = creatorProf.display_name;
      }
    } else {
      const { data: customerProf } = await supabaseAdmin
        .from("CustomerProfile")
        .select("display_name")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (customerProf?.display_name) {
        senderName = customerProf.display_name;
      }
    }

    if (!senderName) {
      const emailPrefix = user.email ? user.email.split("@")[0] : "user";
      senderName = emailPrefix;
      console.warn(`[WARNING] Name lookup returned null for sender_id ${user.id}. Falling back to email prefix: ${emailPrefix}`);
    }

    await createNotification({
      userId: otherId,
      type: notifType,
      title: notifTitle,
      body: `${senderName}: ${bodyText}`,
      relatedEntityId: id,
      link: notifLink
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
    console.error("POST /api/messages/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH /api/messages/[id]
 * Update a thread's status (e.g., accepting a message request).
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
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

    if (status === "accepted" && thread.status === "pending") {
      const initiatorId = thread.initiated_by;
      const [brandRes, creatorRes] = await Promise.all([
        supabaseAdmin.from("BrandProfile").select("id").eq("owner_user_id", initiatorId).maybeSingle(),
        supabaseAdmin.from("CreatorProfile").select("id").eq("owner_user_id", initiatorId).maybeSingle(),
      ]);

      let initiatorPortal = "customer";
      if (creatorRes.data) {
        initiatorPortal = "creator";
      } else if (brandRes.data) {
        initiatorPortal = "brand";
      }

      // Get acceptor's display name
      let acceptorName = "Someone";
      const { data: acceptorCust } = await supabaseAdmin
        .from("CustomerProfile")
        .select("display_name")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (acceptorCust?.display_name) {
        acceptorName = acceptorCust.display_name;
      }

      await createNotification({
        userId: initiatorId,
        type: "request_accepted",
        title: "Message Request Accepted",
        body: `${acceptorName} accepted your message request.`,
        relatedEntityId: id,
        link: `/${initiatorPortal}/messages?thread=${id}`
      });
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("PATCH /api/messages/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
