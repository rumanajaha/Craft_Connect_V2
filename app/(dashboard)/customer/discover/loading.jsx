import React from "react";
import { GridSkeleton } from "@/components/common/Skeletons";

export default function Loading() {
  return <GridSkeleton tileCount={8} />;
}
