"use client";

import SharedFeedPage from "@/components/common/SharedFeedPage";

// Brand owner's category tags — used to surface relevant creators and content
// TODO: pull dynamically from useBrandData().brandInfo.tags once backend is live
const BRAND_TAGS = [
  "ceramics", "handmade", "minimalist", "wabi-sabi", "stoneware",
  "tableware", "kitchen", "hand-thrown"
];

export default function BrandFeedPage() {
  return (
    <SharedFeedPage
      role="brand"
      userTags={BRAND_TAGS}
      heading="Insights Feed"
      subheading="Discover creators, trending products, and brand stories relevant to your niche — ranked by tag affinity and engagement."
      emptyStatePrompt="Complete your brand profile tags in Settings to get better creator and content recommendations."
    />
  );
}
