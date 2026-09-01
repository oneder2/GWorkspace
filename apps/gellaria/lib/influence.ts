export type InfluenceTier = 0 | 1 | 2 | 3;

export type LandmarkInfluence = {
  signalCount: number;
  tagCount: number;
  totalActions: number;
  strength: number;
  tier: InfluenceTier;
  tierLabel: "沉静" | "微光" | "共振" | "改写中";
  dominantTag: string | null;
  dominantTagIndex: number;
  dominantCount: number;
};

const tierLabels = ["沉静", "微光", "共振", "改写中"] as const;

function normalizeCount(value: number | undefined) {
  if (!Number.isFinite(value) || !value || value < 0) return 0;
  return Math.floor(value);
}

export function getLandmarkInfluence(
  signalCount: number | undefined,
  tagCounts: Record<string, number> | undefined,
  tagOptions: readonly string[],
): LandmarkInfluence {
  const signals = normalizeCount(signalCount);
  const counts = tagOptions.map((tag) => normalizeCount(tagCounts?.[tag]));
  const tagCount = counts.reduce((sum, count) => sum + count, 0);
  const totalActions = signals + tagCount;
  const tier: InfluenceTier = totalActions === 0 ? 0 : totalActions < 5 ? 1 : totalActions < 15 ? 2 : 3;
  const dominantCount = Math.max(0, ...counts);
  const dominantTagIndex = dominantCount > 0 ? counts.indexOf(dominantCount) : -1;

  return {
    signalCount: signals,
    tagCount,
    totalActions,
    strength: totalActions === 0 ? 0 : Math.min(1, Math.log1p(totalActions) / Math.log1p(15)),
    tier,
    tierLabel: tierLabels[tier],
    dominantTag: dominantTagIndex >= 0 ? tagOptions[dominantTagIndex] ?? null : null,
    dominantTagIndex,
    dominantCount,
  };
}
