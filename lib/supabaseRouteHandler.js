import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export function getSupabaseRouteClient(response) {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          if (response) {
            response.cookies.set(name, value, options);
          } else {
            try {
              cookieStore.set(name, value, options);
            } catch (error) {
              // Read-only context (e.g. Server Component) — safe to ignore.
            }
          }
        },
        remove(name, options) {
          if (response) {
            response.cookies.set(name, "", { ...options, maxAge: 0 });
          } else {
            try {
              cookieStore.set(name, "", { ...options, maxAge: 0 });
            } catch (error) {
              // Read-only context — safe to ignore.
            }
          }
        },
      },
    }
  );
}