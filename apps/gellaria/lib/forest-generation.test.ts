import { describe, expect, it } from 'vitest';
import { forestSamples, treeSkeleton } from './forest-generation';
import { constrainForestPosition, forestTrees } from './echo-forest';
import { sculpturePoint, designDetail } from './artifact-geometry';

describe('forest modeling and bounded mathematical sculptures', () => {
  it('keeps samples repeatable, separated, outside the text clearing', () => {
    const points = forestSamples();
    expect(points).toEqual(forestSamples());
    expect(points.length).toBeGreaterThan(25);
    expect(points.length).toBeLessThan(80);
    points.forEach(([x, z], i) => {
      expect(Math.abs(x)).toBeGreaterThan(6);
      points.slice(i + 1).forEach(([xx, zz]) => expect(Math.hypot(x - xx, z - zz)).toBeGreaterThanOrEqual(3.3));
    });
  });
  it('puts branch tips above the echo band and bounds the recursive budget', () => {
    for (const tree of forestTrees) {
      const model = treeSkeleton(72, tree.height, tree.radius);
      expect(model.branches.length).toBeLessThan(60);
      expect(model.tips.length).toBe(24);
      expect(model.tips.every(tip => tip[1] > 5)).toBe(true);
      const [x, z] = constrainForestPosition(tree.position[0], tree.position[2]);
      forestTrees.forEach(other => expect(Math.hypot(x - other.position[0], z - other.position[2])).toBeGreaterThanOrEqual(other.radius + .48 - 1e-8));
    }
  });
  it('keeps every formula finite, closed, inside the exhibit footprint', () => {
    for (const family of ['torus-knot', 'lissajous', 'superformula'] as const) for (const p of [2, 3, 4]) for (const lobes of [3, 4, 5, 8]) {
      const recipe = { family, p, q: 5 as const, lobes, phase: .73 };
      const first = sculpturePoint(0, recipe), last = sculpturePoint(1, recipe);
      first.forEach((value, i) => expect(value).toBeCloseTo(last[i]));
      for (let i = 0; i < 200; i++) {
        const [x, y, z] = sculpturePoint(i / 200, recipe);
        if (![x, y, z].every(Number.isFinite) || Math.abs(x) >= 1 || Math.abs(z) >= 1 || y <= 0 || y >= 1.4) {
          throw new Error(`Unbounded sculpture ${JSON.stringify(recipe)} at ${i}: ${x},${y},${z}`);
        }
      }
    }
  });
  it('increases visible detail within a finite geometry budget', () => {
    expect(designDetail(2).segments).toBeGreaterThan(designDetail(1).segments);
    expect(designDetail(7).ornaments).toBeGreaterThan(designDetail(6).ornaments);
    expect(designDetail(100)).toEqual({ segments: 224, ornaments: 56 });
  });
});
