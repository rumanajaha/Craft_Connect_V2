"use client";

import SharedFeedPage from "@/components/common/SharedFeedPage";



const CREATOR_TAGS = [
  "lifestyle", "aesthetic", "slow living", "home decor", "ceramics",
  "handmade", "wabi-sabi", "sustainable"
];

export default function CreatorFeedPage() {
  return (
    <SharedFeedPage
      role="creator"
      userTags={CREATOR_TAGS}
      heading="For You"
      subheading="Fresh brand stories, trending products, and creator content in your niche — ranked by recency and engagement."
      emptyStatePrompt="Complete your creator profile tags to get better brand and content recommendations tailored to your niche."
    />
  );
}
