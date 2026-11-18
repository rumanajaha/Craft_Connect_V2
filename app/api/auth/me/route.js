import { NextResponse } from "next/server";
import { getSupabaseRouteClient } from "@/lib/supabaseRouteHandler";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  try {
    // 1. Primary: session-scoped @supabase/ssr client
    const supabase = getSupabaseRouteClient();
    let { data: { user }, error } = await supabase.auth.getUser();

    // 2. Fallback: legacy sb-access-token cookie if present
    if ((error || !user)) {
      const token = request.cookies.get("sb-access-token")?.value;
      if (token) {
        const res = await supabaseAdmin.auth.getUser(token);
        user = res.data?.user || null;
        error = res.error || null;
      }
    }

    if (error || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Resolve user's role & real profile display name
    let mappedRole = user.user_metadata?.role;
    let displayName = user.user_metadata?.display_name || "";

    if (mappedRole === "brand") mappedRole = "BRANDOWNER";
    else if (mappedRole === "creator") mappedRole = "CREATOR";
    else if (mappedRole === "customer") mappedRole = "CUSTOMER";

    if (!mappedRole || !displayName) {
      const [creatorRes, brandRes, customerRes] = await Promise.all([
        supabaseAdmin
          .from("CreatorProfile")
          .select("id, display_name")
          .eq("owner_user_id", user.id)
          .maybeSingle(),
        supabaseAdmin
          .from("BrandProfile")
          .select("id, brand_name")
          .eq("owner_user_id", user.id)
          .maybeSingle(),
        supabaseAdmin
          .from("CustomerProfile")
          .select("id, display_name")
          .eq("owner_user_id", user.id)
          .maybeSingle(),
      ]);

      if (creatorRes.data) {
        mappedRole = mappedRole || "CREATOR";
        displayName = creatorRes.data.display_name || displayName;
      } else if (brandRes.data) {
        mappedRole = mappedRole || "BRANDOWNER";
        displayName = brandRes.data.brand_name || displayName;
      } else if (customerRes.data) {
        mappedRole = mappedRole || "CUSTOMER";
        displayName = customerRes.data.display_name || displayName;
      } else {
        mappedRole = mappedRole || "CUSTOMER";
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: displayName || user.email?.split("@")[0] || "",
        role: mappedRole,
      },
    });
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
