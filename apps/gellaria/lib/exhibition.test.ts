import { describe, expect, it } from 'vitest';
import { landmarks } from './content';
import { buildMuseumPlan, constrainMuseumPosition, getExhibitKind, selectNearbyExhibit } from './exhibition';
import { readGalleryPlacements } from './compact-gallery';

describe('compact museum planning', () => {
  it('keeps every exhibit in a bounded continuous hall, independent of text length', () => {
    for (const source of landmarks.slice(0, 2)) for (const count of [0, 1, 3, 6, 9, 12]) {
      const hall = { ...source, exhibits: Array.from({ length: count }, (_, i) => ({ ...source.exhibits[0], id: `item-${i}` })) };
      const plan = buildMuseumPlan(hall);
      expect(plan.slots).toHaveLength(count);
      expect(plan.shell!.width * plan.length).toBeLessThanOrEqual(410);
      expect(plan.rooms.length).toBeLessThanOrEqual(3);
      for (const furnishing of plan.furnishings || []) {
        const constrained = constrainMuseumPosition(plan, ...furnishing.position);
        expect(constrained).not.toEqual(furnishing.position);
        expect(Math.abs(constrained[0])).toBeLessThanOrEqual(plan.shell!.width / 2 - .55);
        expect(Math.abs(furnishing.position[0]) + furnishing.size[0] / 2).toBeLessThan(plan.shell!.width / 2);
        expect(furnishing.position[1] - furnishing.size[1] / 2).toBeGreaterThan(plan.backZ);
      }
      // Both peripheral paths and the rear crossing form a real loop, even
      // after adding reading-bay screens and an entrance bench.
      for (let z = 4.7; z >= plan.backZ + 1.2; z -= .1) for (const x of [-8, 8]) expect(constrainMuseumPosition(plan, x, z)).toEqual([x, z]);
      for (let x = -8; x <= 8; x += .1) expect(constrainMuseumPosition(plan, x, plan.backZ + 1.2)).toEqual([x, plan.backZ + 1.2]);
      expect(buildMuseumPlan({ ...hall, exhibits: hall.exhibits.map(item => ({ ...item, summary: '很长的摘要'.repeat(900) })) }).slots.map(slot => slot.position)).toEqual(plan.slots.map(slot => slot.position));
      // Sample actual collision along the shortcut and every cross-aisle.
      for (const slot of plan.slots) {
        const [viewX, viewZ] = slot.viewingPoint!;
        for (let z = plan.entranceZ; z >= viewZ; z -= .1) expect(constrainMuseumPosition(plan, 0, z)).toEqual([0, z]);
        for (let step = 0; step <= 100; step++) {
          const x = viewX * step / 100;
          expect(constrainMuseumPosition(plan, x, viewZ)).toEqual([x, viewZ]);
        }
        expect(selectNearbyExhibit(plan.slots, viewX, viewZ, null)?.id).toBe(slot.id);
        expect(constrainMuseumPosition(plan, slot.position[0], slot.position[2])).not.toEqual([slot.position[0], slot.position[2]]);
        for (const other of plan.slots) if (other !== slot) expect(Math.hypot(other.position[0] - slot.position[0], other.position[2] - slot.position[2])).toBeGreaterThan(3.2);
      }
    }
  });
  it('keeps placements through reordered content, reading growth, hiding and additions', () => {
    const source = landmarks[1];
    const hall = { ...source, exhibits: Array.from({ length: 9 }, (_, i) => ({ ...source.exhibits[0], id: `item-${i}` })) };
    const before = buildMuseumPlan(hall);
    const updated = { ...hall, exhibits: [...hall.exhibits.slice(1).reverse().map(item => ({ ...item, artifactRevision: 100, title: '改过的标题' })), { ...hall.exhibits[0], id: 'new-item' }] };
    const after = buildMuseumPlan(updated, before.placements);
    for (const item of after.slots.filter(slot => slot.id !== 'new-item')) expect(item.position).toEqual(before.slots.find(slot => slot.id === item.id)!.position);
    expect(after.slots.find(slot => slot.id === 'new-item')!.site).toEqual(before.slots.find(slot => slot.id === 'item-0')!.site);
  });
  it('gives daily writing a separate stop without building another room', () => {
    const source = landmarks[1];
    const plan = buildMuseumPlan({ ...source, exhibits: [...Array.from({ length: 11 }, (_, i) => ({ ...source.exhibits[0], id: `article-${i}` })), { ...source.exhibits[0], id: 'daily', presentation: 'daily-signal' as const }] });
    expect(plan.rooms.at(-1)?.title).toBe('今日赠语窗');
    expect(plan.rooms.at(-1)?.count).toBe(1);
    expect(plan.slots).toHaveLength(12);
    expect(plan.length).toBeLessThan(22);
  });
  it('keeps database-bound works in place through slug changes and migrates old local keys', () => {
    const source = landmarks[0];
    const exhibits = [
      { ...source.exhibits[0], id: 'project:old-slug', artifactId: 'artifact:stable' },
      { ...source.exhibits[0], id: 'project:neighbour', artifactId: 'artifact:neighbour' },
    ];
    const before = buildMuseumPlan({ ...source, exhibits }, { 'project:old-slug': 5, 'project:neighbour': 2 });
    const after = buildMuseumPlan({ ...source, exhibits: [{ ...exhibits[0], id: 'project:new-slug', artifactRevision: 99 }, exhibits[1]] }, before.placements);
    expect(after.slots.find(slot => slot.id === 'project:new-slug')?.position).toEqual(before.slots.find(slot => slot.id === 'project:old-slug')?.position);
    expect(after.placements).toEqual({ 'artifact:stable': 5, 'artifact:neighbour': 2 });
    const repeated = buildMuseumPlan({ ...source, exhibits: [{ ...exhibits[0], id: 'placement:a' }, { ...exhibits[0], id: 'placement:b' }] });
    expect(new Set(repeated.slots.map(slot => slot.site)).size).toBe(2);
  });
  it('selects ahead, rejects obscured displays and retains hysteresis', () => {
    const plan = buildMuseumPlan({ ...landmarks[0], exhibits: Array.from({ length: 9 }, (_, i) => ({ ...landmarks[0].exhibits[0], id: `item-${i}` })) });
    const slot = plan.slots[0], [x, z] = slot.viewingPoint!;
    expect(selectNearbyExhibit(plan.slots, x, z, null, [0, -1])?.id).toBe(slot.id);
    expect(selectNearbyExhibit(plan.slots, x, z, slot.id, [0, 1])).toBeNull();
    expect(selectNearbyExhibit([slot], slot.position[0], slot.position[2] + 3.3, slot.id)?.id).toBe(slot.id);
    expect(selectNearbyExhibit([slot], slot.position[0], slot.position[2] + 3.3, null)).toBeNull();
    const blocker = { ...slot, id: 'blocker', position: [x, 0, z - 1] as [number, number, number] };
    expect(selectNearbyExhibit([slot, blocker], x, z, slot.id)?.id).toBe('blocker');
  });
  it('handles invalid saved layouts and rejects overflow instead of dropping content', () => {
    expect(readGalleryPlacements({ getItem: () => '{invalid' }, 'key')).toEqual({});
    expect(readGalleryPlacements({ getItem: () => '{"a":2,"b":99,"c":"0"}' }, 'key')).toEqual({ a: 2 });
    const hall = { ...landmarks[0], exhibits: Array.from({ length: 13 }, (_, i) => ({ ...landmarks[0].exhibits[0], id: `item-${i}` })) };
    expect(() => buildMuseumPlan(hall)).toThrow(/batch/);
  });
  it('preserves forest layout and explicit presentation semantics', () => {
    expect(buildMuseumPlan(landmarks[2]).rooms[0].layout).toBe('garden');
    expect(getExhibitKind('observatory', { ...landmarks[1].exhibits[0], presentation: 'daily-signal' })).toBe('daily-signal');
    expect(getExhibitKind('memory-grove', { ...landmarks[2].exhibits[0], presentation: 'audio-echo' })).toBe('audio-echo');
  });
});
