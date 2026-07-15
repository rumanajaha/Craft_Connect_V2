import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export function getSupabaseRouteClient(response) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        async get(name) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
        async set(name, value, options) {
          if (response) {
            response.cookies.set(name, value, options);
          } else {
            try {
              const cookieStore = await cookies();
              cookieStore.set(name, value, options);
            } catch (error) {
              // Read-only context (e.g. Server Component) — safe to ignore.
            }
          }
        },
        async remove(name, options) {
          if (response) {
            response.cookies.set(name, "", { ...options, maxAge: 0 });
          } else {
            try {
              const cookieStore = await cookies();
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