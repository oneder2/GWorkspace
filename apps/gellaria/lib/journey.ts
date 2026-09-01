export type JourneyProgress = {
  discovered: string[];
  collected: string[];
};

export function normalizeJourney(value: unknown, validIds: readonly string[]): JourneyProgress {
  const source = typeof value === "object" && value !== null ? value as Partial<JourneyProgress> : {};
  const valid = new Set(validIds);
  const normalizeList = (items: unknown) => Array.isArray(items)
    ? [...new Set(items.filter((item): item is string => typeof item === "string" && valid.has(item)))]
    : [];

  const discovered = normalizeList(source.discovered);
  const collected = normalizeList(source.collected);
  return {
    discovered: [...new Set([...discovered, ...collected])],
    collected,
  };
}

export function addJourneyStep(items: readonly string[], id: string, validIds: readonly string[]) {
  if (!validIds.includes(id) || items.includes(id)) return [...items];
  return [...items, id];
}

export function isJourneyComplete(collected: readonly string[], validIds: readonly string[]) {
  return validIds.length > 0 && validIds.every((id) => collected.includes(id));
}
