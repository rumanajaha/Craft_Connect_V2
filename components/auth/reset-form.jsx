"use client";
import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

function ResetFormContent() {
    const router = useRouter();
    const supabase = createClient();

    const [hasSession, setHasSession] = useState(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [countdown, setCountdown] = useState(3);

    const passwordsMatch = password === confirmPassword;
    const isPasswordValid = password.length >= 8;

    useEffect(() => {
        const checkSession = async () => {
            try {
                // Wait briefly for Supabase to finish parsing hash fragment if present
                await new Promise(resolve => setTimeout(resolve, 500));
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) {
                    console.error("Session verification failed:", sessionError);
                    setHasSession(false);
                } else {
                    setHasSession(true);
                }
            } catch (err) {
                console.error("Failed checking recovery session:", err);
                setHasSession(false);
            }
        };
        checkSession();
    }, [supabase]);

    useEffect(() => {
        if (success && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (success && countdown === 0) {
            router.push("/login");
        }
    }, [success, countdown, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (!isPasswordValid) {
            setError("Password must be at least 8 characters long.");
            setIsLoading(false);
            return;
        }
        if (!passwordsMatch) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) {
                setError(updateError.message || "Failed to update password.");
                setIsLoading(false);
                return;
            }

            setSuccess("Your password has been reset successfully! Redirecting to login...");
            setIsLoading(false);
        } catch (err) {
            console.error("Reset password submission error:", err);
            setError("An unexpected error occurred");
            setIsLoading(false);
        }
    };

    if (hasSession === null) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-center font-serif text-2xl font-bold text-brand-dark">Verifying Request</CardTitle>
                    <CardDescription className="text-center text-sm text-brand-muted">
                        Checking reset link validity...
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-32 flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-brand-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                </CardContent>
            </Card>
        );
    }

    if (hasSession === false) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-center font-serif text-2xl font-bold text-brand-dark">Invalid or Expired Link</CardTitle>
                    <CardDescription className="text-center text-sm text-brand-muted">
                        The password reset link is invalid, expired, or has already been used.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center p-6">
                    <div className="p-3.5 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs font-medium text-center w-full">
                        Failed to establish a password recovery session. Please request a new reset link.
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center mt-2">
                    <Link
                        href="/forgot-password"
                        className="text-xs text-brand-primary hover:text-brand-secondary font-semibold transition-colors"
                    >
                        Request New Reset Link
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-center font-serif text-2xl font-bold text-brand-dark">Reset Password</CardTitle>
                <CardDescription className="text-center text-sm text-brand-muted">
                    Choose a new password to secure your account.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5">
                    {error && (
                        <div className="p-3.5 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs font-medium text-center">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3.5 bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] rounded-2xl text-xs font-medium text-center">
                            {success} <br />
                            <span className="font-semibold text-[10px] uppercase tracking-wider block mt-1.5">
                                Redirecting in {countdown} seconds...
                            </span>
                        </div>
                    )}
                    {!success && (
                        <>
                            <div className="flex flex-col gap-1.5 w-full">
                                <Input
                                    id="password"
                                    type="password"
                                    label="New Password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    error={password && password.length < 8 ? "Must be at least 8 characters" : ""}
                                />
                                <ul className={`text-[10px] mt-1 space-y-1 pl-1 ${password && password.length < 8 ? 'text-red-500' : 'text-brand-muted'}`}>
                                    <li className="flex items-center gap-1.5">
                                        <span className="text-xs">{password.length >= 8 ? "✓" : "•"}</span>
                                        At least 8 characters
                                    </li>
                                </ul>
                            </div>
                            <Input
                                id="confirmPassword"
                                type="password"
                                label="Confirm New Password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                error={confirmPassword && !passwordsMatch ? "Passwords do not match" : ""}
                              />
                          </>
                      )}
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4 mt-2">
                      {!success && (
                          <Button
                              type="submit"
                              className="w-full"
                              isLoading={isLoading}
                              variant="primary"
                              disabled={!isPasswordValid || !passwordsMatch}
                          >
                              Reset Password
                          </Button>
                      )}
                      <div className="text-xs text-center text-brand-muted">
                          Back to{" "}
                          <Link
                              href="/login"
                              className="text-brand-primary hover:text-brand-secondary font-semibold transition-colors"
                          >
                              Log in
                          </Link>
                      </div>
                  </CardFooter>
              </form>
          </Card>
      );
  }
  
  export default function ResetForm() {
      return (
          <Suspense fallback={
              <Card className="w-full">
                  <CardHeader>
                      <CardTitle className="text-center font-serif text-2xl font-bold text-brand-dark">Loading</CardTitle>
                      <CardDescription className="text-center text-sm text-brand-muted">
                          Preparing secure password reset form...
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="h-32 flex items-center justify-center">
                      <svg className="animate-spin h-8 w-8 text-brand-primary" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                  </CardContent>
              </Card>
          }>
              <ResetFormContent />
          </Suspense>
      );
  }