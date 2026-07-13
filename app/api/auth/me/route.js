import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  try {
    const token = request.cookies.get("sb-access-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      console.error("Session verification failure:", error?.message);
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Resolve user's role
    let mappedRole = user.user_metadata?.role;
    let displayName = user.user_metadata?.display_name || "";

    if (!mappedRole) {
      const { data: creator } = await supabaseAdmin
        .from("CreatorProfile")
        .select("id, display_name")
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (creator) {
        mappedRole = "CREATOR";
        displayName = creator.display_name;
      } else {
        const { data: brand } = await supabaseAdmin
          .from("BrandProfile")
          .select("id, brand_name")
          .eq("owner_user_id", user.id)
          .maybeSingle();

        if (brand) {
          mappedRole = "BRANDOWNER";
          displayName = brand.brand_name;
        } else {
          const { data: customer } = await supabaseAdmin
            .from("CustomerProfile")
            .select("id, display_name")
            .eq("owner_user_id", user.id)
            .maybeSingle();

          if (customer) {
            mappedRole = "CUSTOMER";
            displayName = customer.display_name;
          } else {
            mappedRole = "CUSTOMER";
          }
        }
      }
    } else {
      if (mappedRole === "brand") mappedRole = "BRANDOWNER";
      else if (mappedRole === "creator") mappedRole = "CREATOR";
      else if (mappedRole === "customer") mappedRole = "CUSTOMER";
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: displayName,
        role: mappedRole
      }
    });
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
