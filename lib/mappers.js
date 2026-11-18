/**
 * Shared mapper for BrandProfile rows -> normalized BrandCard shape.
 * `logo` is strictly `null` when absent (never a placeholder URL/path).
 *
 * @param {object} row - BrandProfile DB row
 * @returns {{ id: string, ownerUserId: string|null, name: string, logo: string|null, location: string, rating: number, reviewCount: number, category: string } | null}
 */
export function toBrandCard(row) {
  if (!row) return null;

  const rawLogo = row.logo_url ?? row.logo ?? null;
  const logo =
    typeof rawLogo === 'string' && rawLogo.trim().length > 0
      ? rawLogo.trim()
      : null;

  const ratingRaw = row.rating_avg ?? row.rating;
  const reviewCountRaw = row.review_count ?? row.reviewCount ?? row.reviewsCount;

  return {
    id: row.id,
    ownerUserId: row.owner_user_id ?? row.ownerUserId ?? null,
    name: row.brand_name ?? row.name ?? '',
    logo,
    location: row.location ?? '',
    rating: ratingRaw !== null && ratingRaw !== undefined ? Number(ratingRaw) : 0,
    reviewCount:
      reviewCountRaw !== null && reviewCountRaw !== undefined
        ? Number(reviewCountRaw)
        : 0,
    category: row.category ?? '',
  };
}

