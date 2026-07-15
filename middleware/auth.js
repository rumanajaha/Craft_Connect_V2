import { getSupabaseRouteClient } from "../lib/supabaseRouteHandler";
import { supabaseAdmin } from "../lib/supabaseServer";

export async function authenticate(request) {
  try {
    const supabase = getSupabaseRouteClient();
    let { data: { user }, error } = await supabase.auth.getUser();

    if (!user) {
      const token = request?.cookies?.get?.("sb-access-token")?.value || 
                    request?.headers?.get?.("cookie")?.split("; ")?.find(c => c.startsWith("sb-access-token="))?.split("=")[1];
      if (token) {
        const { data: adminData } = await supabaseAdmin.auth.getUser(token);
        if (adminData?.user) {
          user = adminData.user;
          error = null;
        }
      }
    }

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
