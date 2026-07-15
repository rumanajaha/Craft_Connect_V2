import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getSupabaseRouteClient } from "@/lib/supabaseRouteHandler";

export async function POST(request) {
  let createdUser = null;
  try {

    let body;
    try {
      body = await request.json();
    } catch (err) {
      console.error("Malformed request JSON:", err);
      return NextResponse.json({ error: "Invalid JSON body in request." }, { status: 400 });
    }

    const { email, password, role, displayName, name } = body;
    const nameToUse = displayName || name || "";


    if (!email || !password || !role) {
      const missing = [];
      if (!email) missing.push("email");
      if (!password) missing.push("password");
      if (!role) missing.push("role");
      console.error(`Signup validation failure: Missing required fields: ${missing.join(", ")}`);
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")} are required.` },
        { status: 400 }
      );
    }

    if (!["brand", "creator", "customer"].includes(role)) {
      console.error(`Signup validation failure: Invalid role "${role}"`);
      return NextResponse.json(
        { error: "Invalid role. Role must be one of 'brand', 'creator', or 'customer'." },
        { status: 400 }
      );
    }

    const metadataRole = role;


    const supabase = getSupabaseRouteClient();
    const { data, error: createUserError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: metadataRole,
          display_name: nameToUse
        }
      }
    });

    if (createUserError || !data?.user) {
      const errMsg = createUserError?.message || "User creation failed";
      console.error("Supabase createUser failure:", errMsg);

      let status = 400;
      if (createUserError?.status) {
        status = createUserError.status;
      } else if (errMsg.toLowerCase().includes("already") || errMsg.toLowerCase().includes("exists") || errMsg.toLowerCase().includes("registered")) {
        status = 409;
      }

      if (status === 429 || errMsg.toLowerCase().includes("rate limit") || errMsg.toLowerCase().includes("security reasons")) {
        return NextResponse.json(
          { error: "Signup limit exceeded. Please try again in a few minutes." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: errMsg },
        { status }
      );
    }

    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      return NextResponse.json(
        { error: "User already exists with this email." },
        { status: 409 }
      );
    }

    createdUser = data.user;

    let profileError = null;

    if (role === "brand") {
      const { error } = await supabaseAdmin
        .from("BrandProfile")
        .insert({
          owner_user_id: createdUser.id,
          brand_name: nameToUse || "My Brand",
          trust_score: 98,
          rating_avg: 4.9,
          review_count: 42
        });
      profileError = error;
    } else if (role === "creator") {
      const { error } = await supabaseAdmin
        .from("CreatorProfile")
        .insert({
          owner_user_id: createdUser.id,
          display_name: nameToUse || "My Profile",
          niches: [],
          follower_count: 0,
          engagement_rate: 0
        });
      profileError = error;
    } else if (role === "customer") {
      const { error } = await supabaseAdmin
        .from("CustomerProfile")
        .insert({
          owner_user_id: createdUser.id,
          display_name: nameToUse || "Customer User"
        });
      profileError = error;
    }

    if (profileError) {
      console.error(`Profile insert failure for role "${role}":`, profileError.message);

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(createdUser.id);
      if (deleteError) {
        console.error("Cleanup failure: Failed to delete orphaned auth user:", deleteError.message);
      }

      return NextResponse.json(
        { error: `Failed to create profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        userId: createdUser.id,
        role: metadataRole
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Signup internal error:", err);

    if (createdUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(createdUser.id).catch((e) => {
        console.error("Cleanup failure in catch block:", e.message);
      });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
