import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  try {
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

    // 2. Fetch all message threads for the logged-in brand owner
    const { data: threads, error: threadsError } = await supabaseAdmin
      .from("MessageThread")
      .select("*")
      .or(`participant_a_id.eq.${user.id},participant_b_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (threadsError) {
      console.error("Error fetching threads:", threadsError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const formattedThreads = [];

    for (const thread of threads) {
      const otherId = thread.participant_a_id === user.id ? thread.participant_b_id : thread.participant_a_id;

      // Resolve other participant details
      let isCreatorThread = false;
      let creatorName = "Customer User";
      let creatorAvatar = "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80";

      // Check Creator Profile first
      const { data: creatorProfile } = await supabaseAdmin
        .from("CreatorProfile")
        .select("display_name")
        .eq("owner_user_id", otherId)
        .maybeSingle();

      if (creatorProfile) {
        isCreatorThread = true;
        creatorName = creatorProfile.display_name;

        // Fetch Creator's Avatar from CustomerProfile
        const { data: customerProfile } = await supabaseAdmin
          .from("CustomerProfile")
          .select("avatar_url")
          .eq("owner_user_id", otherId)
          .maybeSingle();

        if (customerProfile?.avatar_url) {
          creatorAvatar = customerProfile.avatar_url;
        }
      } else {
        // Check Brand Profile next
        const { data: brandProfile } = await supabaseAdmin
          .from("BrandProfile")
          .select("brand_name, logo_url")
          .eq("owner_user_id", otherId)
          .maybeSingle();

        if (brandProfile) {
          creatorName = brandProfile.brand_name;
          if (brandProfile.logo_url) {
            creatorAvatar = brandProfile.logo_url;
          }
        } else {
          // Check Customer Profile
          const { data: customerProfile } = await supabaseAdmin
            .from("CustomerProfile")
            .select("display_name, avatar_url")
            .eq("owner_user_id", otherId)
            .maybeSingle();

          if (customerProfile) {
            creatorName = customerProfile.display_name;
            if (customerProfile.avatar_url) {
              creatorAvatar = customerProfile.avatar_url;
            }
          }
        }
      }

      // Fetch the last message in this thread
      const { data: lastMsg } = await supabaseAdmin
        .from("Message")
        .select("*")
        .eq("thread_id", thread.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let lastMessageText = "No messages yet";
      let lastMessageTime = "";
      let unread = false;

      const dateToFormat = lastMsg ? new Date(lastMsg.created_at) : new Date(thread.created_at);
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

      if (lastMsg) {
        lastMessageText = lastMsg.body;
        // Unread if last message is sent by other party
        unread = lastMsg.sender_id !== user.id;
      }

      formattedThreads.push({
        id: thread.id,
        brandId: "ochre-clay", // Matches UI filter matching brandId
        isCreatorThread,
        creatorName,
        creatorAvatar,
        unread,
        lastMessageTime,
        lastMessageText
      });
    }

    return NextResponse.json({ threads: formattedThreads });
  } catch (err) {
    console.error("GET /api/brand/messages error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
