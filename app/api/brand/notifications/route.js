import { NextResponse } from "next/server";
import { authenticate } from "@/middleware/auth";
import { getSupabaseRouteClient } from "@/lib/supabaseRouteHandler";
import { supabaseAdmin } from "@/lib/supabaseServer";

// GET /api/brand/notifications - Fetch notifications for logged-in brand owner
export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== "BRANDOWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();
    const { data: notifications, error } = await supabase
      .from("Notification")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error.message);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ notifications: notifications || [] });
  } catch (err) {
    console.error("GET /api/brand/notifications error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/brand/notifications - Mark notification(s) as read
export async function PATCH(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== "BRANDOWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    if (body.id) {
      // Mark single notification as read using supabaseAdmin to bypass RLS
      const { error } = await supabaseAdmin
        .from("Notification")
        .update({ is_read: true })
        .eq("id", body.id)
        .eq("user_id", user.id);

      if (error) {
        console.error(`Failed to mark notification ${body.id} as read:`, error.message);
        return NextResponse.json({ error: "Database update error" }, { status: 500 });
      }
    } else {
      // Mark all notifications as read using supabaseAdmin to bypass RLS
      const { error } = await supabaseAdmin
        .from("Notification")
        .update({ is_read: true })
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to mark all notifications as read:", error.message);
        return NextResponse.json({ error: "Database update error" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/brand/notifications error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/brand/notifications - Clear all notifications for brand owner
export async function DELETE(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== "BRANDOWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from("Notification")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to delete all notifications:", error.message);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/brand/notifications error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
