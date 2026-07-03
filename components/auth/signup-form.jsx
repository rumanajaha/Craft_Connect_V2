"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import RoleSelector from "@/components/auth/RoleSelector";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";

export default function SignupForm() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1); // 1: Role picker, 2: Info form, 3: Success verification state
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const handleNextStep = () => {
    if (!role) {
      setErrors({ role: "Please select a role to continue." });
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handlePrevStep = () => {
    setErrors({});
    setSubmitError("");
    setStep(1);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitError("");

    // Simulate network delay for realistic frontend loading
    setTimeout(() => {
      // Flag this as a new signup so the dashboard can greet by name
      if (typeof window !== "undefined") {
        sessionStorage.setItem("cc_new_user", "1");
        sessionStorage.setItem("cc_display_name", fullName.trim().split(" ")[0]);
      }
      router.push(`/welcome?to=/${role}`);
    }, 1000);
  };

  if (step === 3) {
    return (
      <Card className="w-full text-center">
        <CardHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-3">
            <Mail className="w-6 h-6" />
          </div>
          <CardTitle className="font-serif text-2xl font-bold text-brand-dark">Check your email</CardTitle>
          <CardDescription className="text-sm text-brand-muted">
            We've sent a verification link to <span className="font-semibold text-brand-dark">{email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4 text-xs text-brand-muted leading-relaxed">
          Please click the verification link in the email to activate your account and complete your profile onboarding setup.
        </CardContent>
        <CardFooter className="flex flex-col gap-4 mt-2">
          <Button
            onClick={() => router.push(`/onboarding/${role}`)}
            variant="primary"
            className="w-full"
          >
            Go to Onboarding (Placeholder)
          </Button>
          <div className="text-xs text-center text-brand-muted">
            Already verified?{" "}
            <Link
              href="/login"
              className="text-brand-primary hover:text-brand-secondary font-semibold transition-colors"
            >
              Log in
            </Link>
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center font-serif text-2xl font-bold text-brand-dark">Create Account</CardTitle>
        <CardDescription className="text-center text-sm text-brand-muted">
          {step === 1
            ? "Step 1: Choose your role to get started"
            : `Step 2: Join CraftConnect as a ${role === "brand" ? "Brand Owner" : role.charAt(0).toUpperCase() + role.slice(1)}`}
        </CardDescription>
      </CardHeader>

      {step === 1 ? (
        <div className="space-y-4">
          <CardContent>
            {errors.role && (
              <div className="p-3 mb-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-medium text-center">
                {errors.role}
              </div>
            )}
            <RoleSelector selectedRole={role} onSelectRole={setRole} />
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              onClick={handleNextStep}
              className="w-full"
              variant="primary"
            >
              <div className="flex items-center gap-2">
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Button>
            <div className="text-xs text-center text-brand-muted">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-brand-primary hover:text-brand-secondary font-semibold transition-colors"
              >
                Log in
              </Link>
            </div>
          </CardFooter>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3">
            {submitError && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs font-medium text-center">
                {submitError}
              </div>
            )}

            {/* Desktop: side-by-side to reduce height, Mobile: stacked */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="fullName"
                label="Full Name"
                placeholder="Elena Rostova"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
                required
              />

              <Input
                id="email"
                type="email"
                label="Email Address"
                placeholder="elena@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                required
              />
            </div>

            {/* Desktop: side-by-side to reduce height, Mobile: stacked */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="password"
                type="password"
                label="Password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                required
              />

              <Input
                id="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                onClick={handlePrevStep}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                <div className="flex items-center gap-2 justify-center">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </div>
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-[2]"
                isLoading={isLoading}
              >
                Sign Up
              </Button>
            </div>
            <div className="text-xs text-center text-brand-muted">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-brand-primary hover:text-brand-secondary font-semibold transition-colors"
              >
                Log in
              </Link>
            </div>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
