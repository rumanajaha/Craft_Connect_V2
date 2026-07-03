"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Button from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { User, ShieldCheck, Video, ArrowRight, Home } from "lucide-react";

export default function OnboardingPlaceholderPage() {
  const params = useParams();
  const router = useRouter();
  const role = params.role;

  const roleDetails = {
    customer: {
      title: "Customer",
      description: "Discover and follow brands",
      icon: User,
      color: "text-brand-primary bg-brand-primary/10",
      redirectPath: "/customer",
    },
    brand: {
      title: "Brand Owner",
      description: "Build your brand's presence",
      icon: ShieldCheck,
      color: "text-brand-secondary bg-brand-secondary/10",
      redirectPath: "/brand",
    },
    creator: {
      title: "Creator",
      description: "Find brand collaborations",
      icon: Video,
      color: "text-brand-light bg-brand-light/10",
      redirectPath: "/creator",
    },
  };

  const currentRole = roleDetails[role] || {
    title: "Member",
    description: "Welcome to CraftConnect",
    icon: User,
    color: "text-brand-dark bg-brand-border/40",
    redirectPath: "/",
  };

  const Icon = currentRole.icon;

  return (
    <main className="relative min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-cream">
      {/* Background Mesh Gradient */}
      <div className="absolute inset-0 mesh-gradient pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="text-center">
          <CardHeader>
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${currentRole.color}`}>
              <Icon className="w-8 h-8" />
            </div>
            <CardTitle className="font-serif text-3xl font-bold tracking-tight text-brand-dark">
              Welcome, {currentRole.title}!
            </CardTitle>
            <CardDescription className="text-sm text-brand-muted mt-2">
              Your account has been created successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="py-6 text-sm text-brand-muted leading-relaxed">
            <p className="mb-4">
              Thank you for joining CraftConnect. We are building the custom onboarding flow for{" "}
              <strong className="text-brand-dark">{currentRole.title}s</strong> where you can build your profile, showcase your crafts, and set your preferences.
            </p>
            <p className="text-xs italic bg-white/40 p-3 rounded-xl border border-brand-border/50">
              "{currentRole.description}"
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <Button
              onClick={() => router.push(currentRole.redirectPath)}
              variant="primary"
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Back Home</span>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
}
