"use client";

import React, { Suspense } from "react";
import MessagesView from "@/components/MessagesView";

function BrandMessagesContent() {
  return <MessagesView currentRole="brand" />;
}

export default function BrandMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-brand-muted">Loading messages...</div>}>
      <BrandMessagesContent />
    </Suspense>
  );
}
