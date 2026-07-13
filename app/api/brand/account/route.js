import { NextResponse } from "next/server";
import { getSupabaseRouteClient } from "@/lib/supabaseRouteHandler";
import { supabaseAdmin } from "@/lib/supabaseServer";

async function deleteFolder(bucketName, folderPath) {
  try {
    // 1. List all files under the folder
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(bucketName)
      .list(folderPath);

    if (listError) {
      console.error(`Failed listing files in bucket "${bucketName}" under folder "${folderPath}":`, listError.message);
      return;
    }

    if (!files || files.length === 0) {
      return;
    }

    // 2. Construct file paths to delete
    const pathsToRemove = files.map(file => `${folderPath}/${file.name}`);

    // 3. Remove them
    const { error: deleteError } = await supabaseAdmin.storage
      .from(bucketName)
      .remove(pathsToRemove);

    if (deleteError) {
      console.error(`Failed removing files in bucket "${bucketName}":`, deleteError.message);
    } else {
      console.log(`Successfully cleared bucket "${bucketName}" folder "${folderPath}"`);
    }
  } catch (err) {
    console.error(`Unexpected storage cleanup error in bucket "${bucketName}":`, err);
  }
}

export async function DELETE(request) {
  try {
    // 1. Authenticate user using the session client
    const supabase = getSupabaseRouteClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Unauthorized account deletion attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Call delete_brand_account Postgres RPC using supabaseAdmin (requires service role key)
    const { error: dbError } = await supabaseAdmin.rpc("delete_brand_account", {
      target_user_id: user.id
    });

    if (dbError) {
      console.error(`Database transaction deletion error for user ${user.id}:`, dbError.message);
      return NextResponse.json(
        { error: `Database cleanup failed: ${dbError.message}` },
        { status: 500 }
      );
    }

    // 3. Delete the auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      console.error(`Auth user deletion error for user ${user.id}:`, deleteUserError.message);
      return NextResponse.json(
        { error: `Failed to remove user account: ${deleteUserError.message}` },
        { status: 500 }
      );
    }

    // 4. Best-effort clean up user files in brand-logos and product-images storage buckets
    await deleteFolder("brand-logos", user.id);
    await deleteFolder("product-images", user.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Account deletion internal error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
