import { NextResponse } from "next/server";
import { getSupabaseRouteClient } from "@/lib/supabaseRouteHandler";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/brand/messages
 * Fetch all MessageThread records for the logged-in user.
 * Uses batch profile joins (3 queries) instead of N+1.
 */
export async function GET(request) {
  try {
    const supabase = getSupabaseRouteClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch all threads where user is a participant
    const { data: threads, error: threadsError } = await supabaseAdmin
      .from("MessageThread")
      .select("*")
      .or(`participant_a_id.eq.${user.id},participant_b_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (threadsError) {
      console.error("Error fetching threads:", threadsError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!threads || threads.length === 0) {
      return NextResponse.json({ threads: [] });
    }

    // 2. Collect all "other" participant IDs (deduplicated)
    const otherIds = [...new Set(
      threads.map(t => t.participant_a_id === user.id ? t.participant_b_id : t.participant_a_id)
    )];

    // 3. Batch-fetch profiles from all 3 profile tables in parallel
    const [brandRes, creatorRes, customerRes] = await Promise.all([
      supabaseAdmin.from("BrandProfile").select("owner_user_id, brand_name, logo_url, category").in("owner_user_id", otherIds),
      supabaseAdmin.from("CreatorProfile").select("owner_user_id, display_name, niches").in("owner_user_id", otherIds),
      supabaseAdmin.from("CustomerProfile").select("owner_user_id, display_name, avatar_url").in("owner_user_id", otherIds),
    ]);

    // Build lookup maps keyed by owner_user_id
    const brandMap = {};
    (brandRes.data || []).forEach(p => { brandMap[p.owner_user_id] = p; });
    const creatorMap = {};
    (creatorRes.data || []).forEach(p => { creatorMap[p.owner_user_id] = p; });
    const customerMap = {};
    (customerRes.data || []).forEach(p => { customerMap[p.owner_user_id] = p; });

    // 4. Batch-fetch the last message for each thread
    const threadIds = threads.map(t => t.id);
    const { data: allMessages } = await supabaseAdmin
      .from("Message")
      .select("id, thread_id, sender_id, body, created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false });

    // Build a map: threadId -> most recent message
    const lastMessageMap = {};
    (allMessages || []).forEach(msg => {
      if (!lastMessageMap[msg.thread_id]) {
        lastMessageMap[msg.thread_id] = msg;
      }
    });

    // 5. Format threads with resolved profile data
    const formattedThreads = threads.map(thread => {
      const otherId = thread.participant_a_id === user.id ? thread.participant_b_id : thread.participant_a_id;

      // Resolve profile: Creator > Brand > Customer
      let recipientType = "customer";
      let displayName = "Unknown User";
      let avatarUrl = "";
      let category = "";

      const creator = creatorMap[otherId];
      const brand = brandMap[otherId];
      const customer = customerMap[otherId];

      if (creator) {
        recipientType = "creator";
        displayName = creator.display_name || "Creator";
        category = (creator.niches || [])[0] || "";
        // Use customer avatar for creators
        avatarUrl = customer?.avatar_url || "";
      } else if (brand) {
        recipientType = "brand";
        displayName = brand.brand_name || "Brand";
        avatarUrl = brand.logo_url || "";
        category = brand.category || "";
      } else if (customer) {
        recipientType = "customer";
        displayName = customer.display_name || "Customer";
        avatarUrl = customer.avatar_url || "";
      }

      // Last message preview
      const lastMsg = lastMessageMap[thread.id];
      let lastMessageText = "";
      let lastMessageTime = "";
      let unread = false;

      if (lastMsg) {
        lastMessageText = lastMsg.body || "";
        unread = lastMsg.sender_id !== user.id;

        const dateToFormat = new Date(lastMsg.created_at);
        const now = new Date();
        const diffMs = now - dateToFormat;
        const diffMin = Math.round(diffMs / 60000);
        const diffHr = Math.round(diffMs / 3600000);

        if (diffMin < 60) {
          lastMessageTime = diffMin <= 1 ? "Just now" : `${diffMin}m ago`;
        } else if (diffHr < 24) {
          lastMessageTime = `${diffHr}h ago`;
        } else if (diffHr < 48) {
          lastMessageTime = "Yesterday";
        } else {
          lastMessageTime = dateToFormat.toLocaleDateString("en-US", { day: "numeric", month: "short" });
        }
      } else {
        // Thread exists but no messages yet
        const created = new Date(thread.created_at);
        const now = new Date();
        const diffMs = now - created;
        const diffMin = Math.round(diffMs / 60000);
        const diffHr = Math.round(diffMs / 3600000);

        if (diffMin < 60) {
          lastMessageTime = diffMin <= 1 ? "Just now" : `${diffMin}m ago`;
        } else if (diffHr < 24) {
          lastMessageTime = `${diffHr}h ago`;
        } else if (diffHr < 48) {
          lastMessageTime = "Yesterday";
        } else {
          lastMessageTime = created.toLocaleDateString("en-US", { day: "numeric", month: "short" });
        }
      }

      return {
        id: thread.id,
        recipientType,
        recipientId: otherId,
        creatorName: displayName,
        creatorAvatar: avatarUrl,
        category,
        unread,
        lastMessageTime,
        lastMessageText,
        status: thread.status || "pending",
        isInitiator: thread.initiated_by === user.id,
        isCreatorThread: recipientType === "creator",
      };
    });

    return NextResponse.json({ threads: formattedThreads });
  } catch (err) {
    console.error("GET /api/brand/messages error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/brand/messages
 * Create or fetch an existing MessageThread between the logged-in user and a recipient.
 * Enforces symmetric uniqueness: checks both participant orderings before inserting.
 */
export async function POST(request) {
  try {
    const supabase = getSupabaseRouteClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipientId } = await request.json();
    if (!recipientId) {
      return NextResponse.json({ error: "recipientId is required" }, { status: 400 });
    }

    // Prevent messaging yourself
    if (recipientId === user.id) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    // Check both directions for existing thread
    const { data: existingThread } = await supabaseAdmin
      .from("MessageThread")
      .select("id")
      .or(`and(participant_a_id.eq.${user.id},participant_b_id.eq.${recipientId}),and(participant_a_id.eq.${recipientId},participant_b_id.eq.${user.id})`)
      .maybeSingle();

    if (existingThread) {
      return NextResponse.json({ success: true, threadId: existingThread.id });
    }

    // Create new thread with canonical ordering (smaller UUID first)
    const pA = user.id < recipientId ? user.id : recipientId;
    const pB = user.id < recipientId ? recipientId : user.id;

    const { data: newThread, error: createError } = await supabaseAdmin
      .from("MessageThread")
      .insert({
        participant_a_id: pA,
        participant_b_id: pB,
        last_message_at: new Date().toISOString(),
        status: "pending",
        initiated_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      // Handle race condition: unique constraint violation means thread was just created
      if (createError.code === "23505") {
        const { data: raceThread } = await supabaseAdmin
          .from("MessageThread")
          .select("id")
          .or(`and(participant_a_id.eq.${user.id},participant_b_id.eq.${recipientId}),and(participant_a_id.eq.${recipientId},participant_b_id.eq.${user.id})`)
          .maybeSingle();
        if (raceThread) {
          return NextResponse.json({ success: true, threadId: raceThread.id });
        }
      }
      console.error("Error creating MessageThread:", createError);
      return NextResponse.json({ error: "Failed to create message thread" }, { status: 500 });
    }

    return NextResponse.json({ success: true, threadId: newThread.id });
  } catch (err) {
    console.error("POST /api/brand/messages error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
