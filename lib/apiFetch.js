/**
 * apiFetch — drop-in replacement for fetch() that centralises 401 handling.
 *
 * Usage:
 *   import { apiFetch } from "@/lib/apiFetch";
 *   const res = await apiFetch("/api/brand/profile");
 *
 * On a 401 response it redirects to /login?expired=true so the login page
 * can show a "session expired" message, instead of each page handling 401
 * inconsistently.
 */

export async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);

  if (res.status === 401 && typeof window !== "undefined") {
    // Avoid redirect loops if we're already on the login page
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login?expired=true";
    }
    // Still return the response so callers don't crash on undefined
    return res;
  }

  return res;
}
