import { describe, expect, it } from "vitest";
import { addJourneyStep, isJourneyComplete, normalizeJourney } from "./journey";

const ids = ["workshop", "observatory", "memory-grove"];

describe("visitor journey", () => {
  it("normalizes persisted progress and promotes collected landmarks to discovered", () => {
    expect(normalizeJourney({
      discovered: ["workshop", "unknown", "workshop"],
      collected: ["observatory", 42],
    }, ids)).toEqual({
      discovered: ["workshop", "observatory"],
      collected: ["observatory"],
    });
  });

  it("adds only valid, unique progress steps", () => {
    expect(addJourneyStep(["workshop"], "observatory", ids)).toEqual(["workshop", "observatory"]);
    expect(addJourneyStep(["workshop"], "workshop", ids)).toEqual(["workshop"]);
    expect(addJourneyStep([], "unknown", ids)).toEqual([]);
  });

  it("requires every landmark artifact to complete the journey", () => {
    expect(isJourneyComplete(["workshop", "observatory"], ids)).toBe(false);
    expect(isJourneyComplete(ids, ids)).toBe(true);
  });
});
