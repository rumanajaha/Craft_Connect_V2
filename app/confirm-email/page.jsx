"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const email = searchParams.get("email") || "";
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResend = async () => {
    if (!email) {
      setError("No email address provided. Please go back and signup again.");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email
      });

      if (resendError) {
        setError(resendError.message || "Failed to resend confirmation email.");
      } else {
        setMessage("Verification email has been resent successfully!");
      }
    } catch (err) {
      console.error("Resend error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg border border-brand-muted/20">
        <CardHeader className="pt-8 pb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-4 animate-pulse">
            <Mail className="w-8 h-8" />
          </div>
          <CardTitle className="font-serif text-3xl font-bold text-brand-dark">Confirm your email</CardTitle>
          <CardDescription className="text-sm text-brand-muted mt-2">
            We've sent a verification link to <span className="font-semibold text-brand-dark">{email || "your inbox"}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-2 text-sm text-brand-muted leading-relaxed px-6">
          <p className="mb-4">
            Please check your inbox and click the confirmation link to activate your account. You can log in only after verifying your email address.
          </p>

          {message && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200 text-xs text-left mb-2 transition-all duration-300">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 text-xs text-left mb-2 transition-all duration-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pb-8 px-6 mt-4">
          <Button
            onClick={handleResend}
            disabled={isLoading || !email}
            className="w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Resending...
              </>
            ) : (
              "Resend confirmation email"
            )}
          </Button>

          <Link href="/login" className="flex items-center justify-center gap-2 text-xs font-semibold text-brand-muted hover:text-brand-dark transition-colors duration-200 mt-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}
