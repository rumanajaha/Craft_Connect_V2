"use client";

import React, { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * AuthGuardProvider — listens for Supabase auth state changes at the app's
 * top level. When a SIGNED_OUT event fires (expired token, password changed
 * elsewhere, session revoked in Supabase dashboard, etc.) it immediately
 * redirects to /login so the user isn't stuck on a broken authenticated page.
 */
export function AuthGuardProvider({ children }) {
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, _session) => {
      if (event === "SIGNED_OUT") {
        // Only redirect if we're on an authenticated page
        const path = window.location.pathname;
        if (
          !path.startsWith("/login") &&
          !path.startsWith("/signup") &&
          !path.startsWith("/forgot-password") &&
          !path.startsWith("/reset-password") &&
          path !== "/"
        ) {
          window.location.href = "/login?expired=true";
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
