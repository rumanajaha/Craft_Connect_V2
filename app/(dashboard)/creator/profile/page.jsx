"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CreatorPublicProfileView from "@/components/creator/CreatorPublicProfileView";

function CreatorProfileInner() {
  const searchParams = useSearchParams();
  const creatorId = searchParams?.get("id") || null;
  return (
    <CreatorPublicProfileView
      creatorId={creatorId}
      backHref={creatorId ? "/creator/feed" : null}
      backLabel="Back to For You"
      portalRole="CREATOR"
    />
  );
}

export default function CreatorPublicProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </div>
      }
    >
      <CreatorProfileInner />
    </Suspense>
  );
}
