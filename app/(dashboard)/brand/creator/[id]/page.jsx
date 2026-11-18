"use client";

import React from "react";
import { useParams } from "next/navigation";
import CreatorPublicProfileView from "@/components/creator/CreatorPublicProfileView";

export default function BrandCreatorProfilePage() {
  const { id } = useParams();
  return (
    <CreatorPublicProfileView
      creatorId={id}
      backHref="/brand/feed"
      backLabel="Back to Feed"
      portalRole="BRANDOWNER"
    />
  );
}

