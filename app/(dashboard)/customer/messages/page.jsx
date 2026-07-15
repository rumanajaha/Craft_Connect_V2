"use client";

import React, { Suspense } from "react";
import MessagesView from "@/components/MessagesView";

function CustomerMessagesContent() {
  return <MessagesView currentRole="customer" />;
}

export default function CustomerMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-brand-muted">Loading messages...</div>}>
      <CustomerMessagesContent />
    </Suspense>
  );
}
