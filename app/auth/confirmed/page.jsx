"use client";

import React from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function ConfirmedPage() {
  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg border border-brand-muted/20">
        <CardHeader className="pt-8 pb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-4 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <CardTitle className="font-serif text-3xl font-bold text-brand-dark">Email Confirmed!</CardTitle>
          <CardDescription className="text-sm text-brand-muted mt-2">
            Your account is now active and ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-2 text-sm text-brand-muted leading-relaxed px-6">
          <p>
            Thank you for verifying your email address. You have successfully completed the registration setup process.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pb-8 px-6 mt-4">
          <Link href="/login" className="w-full">
            <Button className="w-full flex items-center justify-center gap-2">
              Log in to your account
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
