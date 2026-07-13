import { getSupabaseRouteClient } from "../lib/supabaseRouteHandler";

export async function authenticate(request) {
  try {
    const supabase = getSupabaseRouteClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.error("Auth middleware check failed:", error?.message);
      return null;
    }

    // Resolve user role
    let mappedRole = user.user_metadata?.role;
    if (!mappedRole) {
      const { data: creator } = await supabase
        .from("CreatorProfile")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (creator) {
        mappedRole = "CREATOR";
      } else {
        const { data: brand } = await supabase
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
      if (mappedRole === "brand") mappedRole = "BRANDOWNER";
      else if (mappedRole === "creator") mappedRole = "CREATOR";
      else if (mappedRole === "customer") mappedRole = "CUSTOMER";
    }

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.display_name || "",
      role: mappedRole
    };
  } catch (err) {
    console.error("Auth middleware internal error:", err);
    return null;
  }
}
