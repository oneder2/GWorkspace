import { describe, expect, it } from "vitest";
import { landmarks, landmarkSchema } from "./content";

describe("world content", () => {
  it("contains uniquely addressable landmarks within the playable island", () => {
    expect(new Set(landmarks.map((item) => item.id)).size).toBe(landmarks.length);
    for (const landmark of landmarks) {
      expect(landmarkSchema.safeParse(landmark).success).toBe(true);
      expect(Math.hypot(landmark.position[0], landmark.position[2])).toBeLessThan(18);
    }
  });

  it("provides a visitor action and artifact for every landmark", () => {
    for (const landmark of landmarks) {
      expect(landmark.actionLabel.length).toBeGreaterThan(1);
      expect(landmark.artifact.length).toBeGreaterThan(4);
      expect(new Set(landmark.tagOptions).size).toBe(3);
      expect(landmark.exhibits.length).toBeGreaterThan(0);
      expect(new Set(landmark.exhibits.map((exhibit) => exhibit.id)).size).toBe(landmark.exhibits.length);
      expect(landmark.influenceColors).toHaveLength(landmark.tagOptions.length);
    }
  });
});
