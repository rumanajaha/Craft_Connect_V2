import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request) {
  let createdUser = null;
  try {
    const body = await request.json();
    const { email, password, role, displayName, name } = body;
    const nameToUse = displayName || name || "";

    // 1. Parse and validate the request body
    if (!email || !password || !role) {
      console.error("Signup validation failure: Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: email, password, and role are required." },
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

    const metadataRole = role === "brand" ? "BRANDOWNER" : role === "creator" ? "CREATOR" : "CUSTOMER";

    // 2. Use supabaseAdmin to create the auth user
    const { data, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: metadataRole,
        display_name: nameToUse
      }
    });

    if (createUserError || !data?.user) {
      console.error("Supabase createUser failure:", createUserError?.message || "User creation failed");
      return NextResponse.json(
        { error: createUserError?.message || "User registration failed." },
        { status: 400 }
      );
    }

    createdUser = data.user;

    // 3. On success, insert one row into the correct profile table based on role
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

    // 4. If the profile insert fails, delete the auth user before returning the error
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

    // 5. Return success response
    return NextResponse.json({
      userId: createdUser.id,
      role: metadataRole
    });
  } catch (err) {
    console.error("Signup internal error:", err);
    
    // Cleanup if user was created before error threw
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
