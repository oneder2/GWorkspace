import { describe, expect, it } from "vitest";
import { isWithinInteractionRange } from "./proximity";

describe("interaction proximity", () => {
  it("activates when a player reaches the entrance radius", () => {
    expect(isWithinInteractionRange([5, 4.8], [5, 11], 6.2, 6.8, false)).toBe(true);
  });

  it("does not activate while the player is still outside", () => {
    expect(isWithinInteractionRange([0, 5], [5, 11], 6.2, 6.8, false)).toBe(false);
  });

  it("uses a wider release radius to prevent edge flicker", () => {
    expect(isWithinInteractionRange([5, 4.5], [5, 11], 6.2, 6.8, true)).toBe(true);
    expect(isWithinInteractionRange([5, 4], [5, 11], 6.2, 6.8, true)).toBe(false);
  });
});
