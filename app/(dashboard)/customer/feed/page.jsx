"use client";

import SharedFeedPage from "@/components/common/SharedFeedPage";

export default function CustomerFeedPage() {
  return (
    <SharedFeedPage
      role="customer"
      heading="For You"
      subheading="A personalised mix of products and creator content — ranked by your saved brands."
      emptyStatePrompt="Save a few brands to personalise your feed. Head to Discover to find handcrafted brands you love!"
    />
  );
}
