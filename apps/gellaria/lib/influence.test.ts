import { describe, expect, it } from "vitest";
import { getLandmarkInfluence } from "./influence";

const tags = ["仍在生长", "想亲手试试", "值得再来"] as const;

describe("landmark influence", () => {
  it("keeps an untouched landmark dormant", () => {
    expect(getLandmarkInfluence(0, undefined, tags)).toEqual({
      signalCount: 0,
      tagCount: 0,
      totalActions: 0,
      strength: 0,
      tier: 0,
      tierLabel: "沉静",
      dominantTag: null,
      dominantTagIndex: -1,
      dominantCount: 0,
    });
  });

  it("projects signals and tags into stable response tiers", () => {
    const faint = getLandmarkInfluence(2, { 仍在生长: 1 }, tags);
    const resonant = getLandmarkInfluence(5, { 仍在生长: 2, 想亲手试试: 3 }, tags);
    const altered = getLandmarkInfluence(12, { 值得再来: 6 }, tags);

    expect(faint.tierLabel).toBe("微光");
    expect(resonant.tierLabel).toBe("共振");
    expect(altered.tierLabel).toBe("改写中");
    expect(faint.strength).toBeGreaterThan(0);
    expect(altered.strength).toBe(1);
  });

  it("uses content order to resolve dominant-tag ties and ignores invalid counts", () => {
    const influence = getLandmarkInfluence(-4, {
      仍在生长: 3.8,
      想亲手试试: 3,
      值得再来: Number.NaN,
      unknown: 100,
    }, tags);

    expect(influence.signalCount).toBe(0);
    expect(influence.tagCount).toBe(6);
    expect(influence.dominantTag).toBe("仍在生长");
    expect(influence.dominantTagIndex).toBe(0);
    expect(influence.dominantCount).toBe(3);
  });
});
