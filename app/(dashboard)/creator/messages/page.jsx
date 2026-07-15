"use client";

import React, { Suspense } from "react";
import MessagesView from "@/components/MessagesView";

function CreatorMessagesContent() {
  return <MessagesView currentRole="creator" />;
}

export default function CreatorMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-brand-muted">Loading messages...</div>}>
      <CreatorMessagesContent />
    </Suspense>
  );
}
