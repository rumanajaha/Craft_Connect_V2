"use client";

import SharedFeedPage from "@/components/common/SharedFeedPage";



const CUSTOMER_TAGS = [
  "ceramics", "handmade", "minimalist", "wabi-sabi", "slow living",
  "tableware", "eco-friendly", "home decor"
];

export default function CustomerFeedPage() {
  return (
    <SharedFeedPage
      role="customer"
      userTags={CUSTOMER_TAGS}
      heading="For You"
      subheading="A personalised mix of products, brand updates, and creator content — ranked by your saved brands and style preferences."
      emptyStatePrompt="Save a few brands to personalise your feed. Head to Discover to find handcrafted brands you love!"
    />
  );
}
