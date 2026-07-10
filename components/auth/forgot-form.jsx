"use client";
import React, { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
export default function ForgotForm() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");
        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.error || "Failed to process request");
                setIsLoading(false);
                return;
            }
            setSuccess(data.message || "Reset link has been sent!");
            setEmail("");
            setIsLoading(false);
        } catch (err) {
            setError("An unexpected error occurred");
            setIsLoading(false);
        }
    };
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-center font-serif text-2xl font-bold text-brand-dark">Forgot Password</CardTitle>
                <CardDescription className="text-center text-sm text-brand-muted">
                    Enter your email address and we'll send you a link to reset your password.
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
                            {success}
                        </div>
                    )}
                    {!success && (
                        <Input
                            id="email"
                            type="email"
                            label="Email Address"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4 mt-2">
                    {!success && (
                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={isLoading}
                            variant="primary"
                        >
                            Send Reset Link
                        </Button>
                    )}
                    <div className="text-xs text-center text-brand-muted">
                        Remember your password?{" "}
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