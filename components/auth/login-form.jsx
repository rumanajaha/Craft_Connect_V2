"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

import { Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "EMAIL_NOT_CONFIRMED") {
          setError("Please confirm your email first. Check your inbox for the verification link.");
        } else {
          setError(data.error || "Login failed");
        }
        setIsLoading(false);
        return;
      }

      const roleMap = {
        CREATOR: "/creator",
        BRANDOWNER: "/brand",
        CUSTOMER: "/customer",
        creator: "/creator",
        brand: "/brand",
        customer: "/customer"
      };

      const route = roleMap[data.user.role] || "/login";
      router.push(`/welcome?to=${encodeURIComponent(route)}`);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
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
            <div className="relative w-full">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-10 rounded-2xl bg-white/70 border border-brand-border/80 focus:border-brand-primary focus:ring-brand-primary/20 text-brand-dark placeholder-brand-muted/70 text-sm transition-all duration-300 outline-none focus:ring-4"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
