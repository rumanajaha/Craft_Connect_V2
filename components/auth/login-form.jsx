"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate network delay for realistic frontend loading
    setTimeout(() => {
      let role = "creator"; // Default fallback
      
      const lowerEmail = email.toLowerCase();
      if (lowerEmail.includes("brand")) {
        role = "brand";
      } else if (lowerEmail.includes("customer")) {
        role = "customer";
      }

      router.push(`/welcome?to=/${role}`);
    }, 1000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center font-serif text-2xl font-bold text-brand-dark">Welcome Back</CardTitle>
        <CardDescription className="text-center text-sm text-brand-muted">
          Log in to manage collaborations, discover brands, and view recommendations.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs font-medium text-center">
              {error}
            </div>
          )}

          <Input
            id="email"
            type="email"
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-xs font-sans font-semibold uppercase tracking-wider text-brand-dark/80 select-none">
                Password <span className="text-brand-primary">*</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-brand-primary hover:text-brand-secondary font-semibold transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-brand-border/80 focus:border-brand-primary focus:ring-brand-primary/20 text-brand-dark placeholder-brand-muted/70 text-sm transition-all duration-300 outline-none focus:ring-4"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 mt-2">
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            variant="primary"
          >
            Log In
          </Button>
          <div className="text-xs text-center text-brand-muted">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-brand-primary hover:text-brand-secondary font-semibold transition-colors"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
