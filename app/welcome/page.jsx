"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

function WelcomeTransition() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();

  const queryDest = searchParams.get("to");
  const [destination, setDestination] = useState("");
  const [fadeOut, setFadeOut] = useState(false);

  // Check user role from Supabase, fallback to query param or login
  useEffect(() => {
    async function checkRoleAndSession() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        const role = data?.user?.user_metadata?.role;
        
        if (role) {
          // If query destination was onboarding, keep onboarding. Otherwise redirect to dashboard
          if (queryDest && queryDest.includes("onboarding")) {
            setDestination(queryDest);
          } else {
            setDestination(`/${role}`);
          }
        } else if (queryDest) {
          setDestination(queryDest);
        } else {
          setDestination("/login");
        }
      } catch (err) {
        setDestination(queryDest || "/login");
      }
    }

    checkRoleAndSession();
  }, [queryDest]);

  // Handle welcome screen timing and redirection
  useEffect(() => {
    if (!destination) return;

    const animDuration = shouldReduceMotion ? 500 : 2000;
    const redirectDuration = shouldReduceMotion ? 800 : 2400;

    // Trigger full-screen fadeout
    const fadeTimeout = setTimeout(() => {
      setFadeOut(true);
    }, animDuration);

    // Redirect to final dashboard/onboarding route
    const redirectTimeout = setTimeout(() => {
      router.replace(destination);
    }, redirectDuration);

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(redirectTimeout);
    };
  }, [destination, shouldReduceMotion, router]);

  const characters = Array.from("CraftConnect");

  // Motion variants
  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.05,
      }
    }
  };

  const letterVariants = {
    initial: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 15,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <motion.div
      className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-[#FAF7F0] z-50 px-6"
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <div className="text-center">
        {/* Wordmark Staggered Reveal */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="font-serif text-5xl md:text-6xl font-bold tracking-tight text-brand-dark flex items-center justify-center select-none"
        >
          {characters.map((char, index) => (
            <motion.span key={index} variants={letterVariants}>
              {char}
            </motion.span>
          ))}
          {/* Orange period animating at the end */}
          <motion.span
            variants={letterVariants}
            className="text-brand-primary"
          >
            .
          </motion.span>
        </motion.div>

        {/* Tagline reveal */}
        <motion.p
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: shouldReduceMotion ? 0.2 : 0.9,
            duration: 0.8,
            ease: "easeOut"
          }}
          className="mt-4 text-brand-muted text-sm md:text-base tracking-wide font-sans"
        >
          Where independent makers get discovered
        </motion.p>
      </div>
    </motion.div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-[#FAF7F0] z-50">
        <div className="font-serif text-4xl font-bold text-brand-dark animate-pulse select-none">
          CraftConnect<span className="text-brand-primary">.</span>
        </div>
      </div>
    }>
      <WelcomeTransition />
    </Suspense>
  );
}
