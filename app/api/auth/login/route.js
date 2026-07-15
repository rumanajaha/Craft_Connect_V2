import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getSupabaseRouteClient } from "@/lib/supabaseRouteHandler";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // 1. Validate fields
    if (!email || !password) {
      console.error("Login validation failure: Missing email or password");
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    // 2. Call Supabase auth to sign in with password
    const supabase = getSupabaseRouteClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data?.user) {
      const errMsg = error?.message || "Invalid credentials";
      console.error("Supabase signInWithPassword failure:", errMsg);

      if (errMsg.toLowerCase().includes("email not confirmed") || errMsg.toLowerCase().includes("email_not_confirmed") || errMsg.toLowerCase().includes("confirm your email")) {
        return NextResponse.json(
          { error: "EMAIL_NOT_CONFIRMED" },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: errMsg },
        { status: 401 }
      );
    }

    const user = data.user;

    // 3. Resolve the user's role
    let mappedRole = user.user_metadata?.role;

    if (!mappedRole) {
      // Fallback checking profile tables
      const { data: creator } = await supabaseAdmin
        .from("CreatorProfile")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (creator) {
        mappedRole = "CREATOR";
      } else {
        const { data: brand } = await supabaseAdmin
          .from("BrandProfile")
          .select("id")
          .eq("owner_user_id", user.id)
          .maybeSingle();

        if (brand) {
          mappedRole = "BRANDOWNER";
        } else {
          mappedRole = "CUSTOMER";
        }
      }
    } else {
      // Standardize metadata values
      if (mappedRole === "brand") mappedRole = "BRANDOWNER";
      else if (mappedRole === "creator") mappedRole = "CREATOR";
      else if (mappedRole === "customer") mappedRole = "CUSTOMER";
    }

    // 4. Form the response and set authorization cookies
    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: mappedRole
      }
    });

    if (data.session) {
      response.cookies.set("sb-access-token", data.session.access_token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
      });
      response.cookies.set("sb-refresh-token", data.session.refresh_token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
      });
    }

    // Clear legacy Prisma token cookie to avoid credentials pollution
    response.cookies.delete("token");

    return response;
  } catch (err) {
    console.error("Login route internal error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
