"use client";

import React from "react";
import { useParams } from "next/navigation";
import CreatorPublicProfileView from "@/components/creator/CreatorPublicProfileView";

export default function CustomerCreatorProfilePage() {
  const { id } = useParams();
  return (
    <CreatorPublicProfileView
      creatorId={id}
      backHref="/customer/feed"
      backLabel="Back to For You"
      portalRole="CUSTOMER"
    />
  );
}

