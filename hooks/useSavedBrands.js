"use client";

import { useState, useCallback } from "react";

/**
 * Shared optimistic bookmark toggle for Customer Dashboard, Discover, and Saved pages.
 * Calls POST /api/customer/saved-brands and DELETE /api/customer/saved-brands/[brandId].
 * Rolls back on failure and updates savedCount strictly from server stats.
 */
export function useSavedBrands({ initialIds = [], initialCount = 0 } = {}) {
  const [savedIds, setSavedIds] = useState(initialIds);
  const [savedCount, setSavedCount] = useState(initialCount);

  const hydrateSaved = useCallback((ids, serverCount) => {
    setSavedIds(Array.isArray(ids) ? ids : []);
    if (typeof serverCount === "number") {
      setSavedCount(serverCount);
    }
  }, []);

  const toggleSave = useCallback(
    async (brandId, { onOptimisticRemove, onRollback } = {}) => {
      const wasSaved = savedIds.includes(brandId);
      const prevIds = savedIds;
      const prevCount = savedCount;

      // Optimistic toggle
      setSavedIds((prev) =>
        wasSaved ? prev.filter((id) => id !== brandId) : [...prev, brandId]
      );
      if (wasSaved && onOptimisticRemove) {
        onOptimisticRemove(brandId);
      }

      try {
        const res = wasSaved
          ? await fetch(`/api/customer/saved-brands/${encodeURIComponent(brandId)}`, {
              method: "DELETE",
            })
          : await fetch("/api/customer/saved-brands", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ brandId }),
            });

        if (!res.ok) {
          throw new Error("Bookmark toggle failed");
        }

        const data = await res.json();
        if (typeof data?.stats?.savedBrands === "number") {
          setSavedCount(data.stats.savedBrands);
        }
        return { ok: true, saved: !wasSaved, stats: data.stats };
      } catch (err) {
        console.error("Failed to toggle saved brand:", err);
        setSavedIds(prevIds);
        setSavedCount(prevCount);
        if (onRollback) onRollback();
        return { ok: false, saved: wasSaved };
      }
    },
    [savedIds, savedCount]
  );

  return {
    savedIds,
    savedCount,
    hydrateSaved,
    toggleSave,
  };
}

