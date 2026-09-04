import { describe, expect, it } from "vitest";
import { centralCourtyard, groundPointToward, yawToward, type WorldPosition } from "./world-layout";

const buildings: WorldPosition[] = [
  [11, 0, 3],
  [-3, 0, -12],
  [-12, 0, 4],
  [7.5, 0, 10.5],
];

describe("outdoor building layout", () => {
  it("rotates each local +Z entrance toward the central courtyard", () => {
    for (const position of buildings) {
      const yaw = yawToward(position);
      const entranceDirection = [Math.sin(yaw), Math.cos(yaw)];
      const targetDirection = [centralCourtyard[0] - position[0], centralCourtyard[1] - position[2]];
      const targetLength = Math.hypot(...targetDirection);

      expect(entranceDirection[0]).toBeCloseTo(targetDirection[0] / targetLength);
      expect(entranceDirection[1]).toBeCloseTo(targetDirection[1] / targetLength);
    }
  });

  it("ends paths at the requested distance in front of each building", () => {
    for (const position of buildings) {
      const approach = groundPointToward(position, 2.55);
      expect(Math.hypot(approach[0] - position[0], approach[1] - position[2])).toBeCloseTo(2.55);
      expect(Math.hypot(approach[0] - centralCourtyard[0], approach[1] - centralCourtyard[1]))
        .toBeLessThan(Math.hypot(position[0] - centralCourtyard[0], position[2] - centralCourtyard[1]));
    }
  });
});
