import { describe, expect, it } from "vitest";
import { constrainForestPosition, constrainLoopForest, forestLoopCoordinate, nearestForestEcho, forestPathX, forestTreeVisible, advanceEchoTime, echoGraphemes, echoPhase, echoPlacement, forestTrees } from "./echo-forest";

describe("spatial forest echoes", () => {
  it('finishes revealing nearby words, holds them, then resumes when the reader leaves', () => {
    expect(advanceEchoTime(2, .1, 20, 2, 3)).toBeCloseTo(2.1);
    expect(advanceEchoTime(5, 100, 20, 2, 3)).toBe(5);
    expect(advanceEchoTime(5, .1, 20, 2, 6)).toBeCloseTo(5.1);
    expect(advanceEchoTime(5, 0, 20, 2, 6)).toBe(5);
    expect(advanceEchoTime(10, .1, 20, 2, 3)).toBeCloseTo(10.1);
    expect(advanceEchoTime(0, 100, 20, 2, 6, true)).toBe(0);
  });
  it('only collides with trees present in each clearing, including later laps', () => {
    for (let lap = -2; lap <= 2; lap++) {
      forestTrees.forEach((tree, index) => {
        if (Math.abs(tree.position[0]) > 12) return;
        const [x, z] = constrainLoopForest(tree.position[0], tree.position[2], lap);
        const distance = Math.hypot(x - tree.position[0], z - tree.position[2]);
        if (forestTreeVisible(tree, index, lap)) expect(distance).toBeGreaterThanOrEqual(tree.radius + .47);
        else expect(distance).toBeLessThan(.001);
      });
    }
  });
  it('wraps in both directions while preserving distance and a seamless periodic path', () => {
    expect(forestLoopCoordinate(-41.1)).toBeCloseTo(6.9);
    expect(forestLoopCoordinate(7.1)).toBeCloseTo(-40.9);
    expect(forestPathX(-41)).toBeCloseTo(forestPathX(7));
    for (let z = -5000; z < 5000; z += .71) {
      const [x, wrapped] = constrainLoopForest(0, z);
      if (x !== 0 || wrapped < -41 || wrapped >= 7 || Math.abs(nearestForestEcho(-5, wrapped) - wrapped) > 24) {
        throw new Error(`Invalid cyclic position at ${z}: ${x}, ${wrapped}`);
      }
    }
  });
  it("keeps Chinese, combining characters and emoji intact", () => {
    expect(echoGraphemes("林间🌲e\u0301👩‍💻")).toEqual(["林", "间", "🌲", "e\u0301", "👩‍💻"]);
  });
  it("varies all spatial axes and size deterministically, with staggered timing", () => {
    const placements = Array.from({ length: 12 }, (_, i) => echoPlacement(`echo-${i}`, i));
    for (let axis = 0; axis < 3; axis++) expect(new Set(placements.map(item => item.position[axis])).size).toBeGreaterThan(6);
    expect(new Set(placements.map(item => item.size)).size).toBeGreaterThan(6);
    expect(echoPlacement("one", 1)).toEqual(echoPlacement("one", 1));
    expect(echoPlacement("one", 1, 1)).not.toEqual(echoPlacement("one", 1, 0));
    expect(placements.every(item => Math.abs(item.position[0]) < 8 && item.position[1] > 1 && item.position[1] < 6 && item.position[2] > -40)).toBe(true);
  });
  it("reveals, holds, erases and rests before another appearance", () => {
    expect(echoPhase(0, 20, 2).opacity).toBe(0);
    expect(echoPhase(2.95, 20, 2).visible).toBeCloseTo(10);
    expect(echoPhase(5, 20, 2).erased).toBe(-1);
    expect(echoPhase(10, 20, 2).erased).toBeGreaterThan(0);
    expect(echoPhase(14, 20, 2).opacity).toBe(0);
    expect(echoPhase(20, 20, 2).cycle).toBeGreaterThan(0);
  });
  it("reduced motion displays complete stable text without cycling", () => {
    expect(echoPhase(0, 24, 8, true)).toEqual(echoPhase(1000, 24, 8, true));
    expect(echoPhase(0, 24, 8, true)).toMatchObject({ visible: 25, erased: -1, opacity: .9 });
  });
  it("keeps the central trail open and prevents walking through tree trunks", () => {
    for (let z = -40; z < 6.8; z += .25) expect(constrainForestPosition(0, z)).toEqual([0, z]);
    for (const tree of forestTrees) {
      const [x, z] = constrainForestPosition(tree.position[0], tree.position[2]);
      expect(x).toBeGreaterThanOrEqual(-13); expect(x).toBeLessThanOrEqual(13);
      expect(z).toBeGreaterThanOrEqual(-40); expect(z).toBeLessThanOrEqual(6.8);
    }
    expect(constrainForestPosition(100, -100)).toEqual([13, -40]);
  });
});
