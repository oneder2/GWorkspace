import { describe, expect, it } from "vitest";
import { landmarks } from "./content";
import { buildMuseumPlan, constrainMuseumPosition, getExhibitKind, selectNearbyExhibit } from "./exhibition";

describe("museum planning", () => {
  it("uses different spatial arrangements for each hall's function", () => {
    const plans = landmarks.map((hall) => buildMuseumPlan({ ...hall, exhibits: Array.from({ length: 4 }, (_, i) => ({ ...hall.exhibits[0], id: `item-${i}` })) }));
    expect(plans.map((plan) => plan.rooms[0].layout)).toEqual(["fabrication", "archive", "garden"]);
    expect(plans[0].slots[0].position[2]).toBe(plans[0].slots[1].position[2]);
    expect(plans[1].slots[0].position[2]).not.toBe(plans[1].slots[1].position[2]);
    expect(plans[2].slots.map((slot) => slot.position)).not.toEqual(plans[1].slots.map((slot) => slot.position));
  });
  it("separates daily writing from long-form exhibits without dropping content", () => {
    const source = landmarks[1];
    const landmark = { ...source, exhibits: [
      { ...source.exhibits[0], id: "daily", presentation: "daily-signal" as const },
      ...source.exhibits,
    ] };
    const plan = buildMuseumPlan(landmark);
    expect(plan.rooms.map((room) => room.kind)).toEqual(["blog-constellation", "daily-signal"]);
    expect(new Set(plan.slots.map((slot) => slot.id))).toEqual(new Set(landmark.exhibits.map((item) => item.id)));
  });

  it("extends rooms with object spacing and a connected accessible spine", () => {
    for (const source of landmarks) for (const count of [0, 1, 4, 5, 9, 12, 40]) {
      const landmark = { ...source, exhibits: Array.from({ length: count }, (_, i) => ({ ...source.exhibits[0], id: `exhibit-${i}`, summary: "长文".repeat(i * 20) })) };
      const plan = buildMuseumPlan(landmark);
      expect(plan.slots).toHaveLength(count);
      expect(plan.rooms.every((room) => room.count <= 4)).toBe(true);
      expect(buildMuseumPlan(landmark)).toEqual(plan);
      for (let z = plan.entranceZ; z > plan.backZ + 1; z -= .15) expect(constrainMuseumPosition(plan, 0, z)).toEqual([0, z]);
      for (const slot of plan.slots) {
        const approachX = slot.position[0] + (slot.position[0] < 0 ? 2 : -2);
        expect(constrainMuseumPosition(plan, approachX, slot.position[2])).toEqual([approachX, slot.position[2]]);
        expect(selectNearbyExhibit(plan.slots, approachX, slot.position[2], null)?.id).toBe(slot.id);
        for (const other of plan.slots) if (slot !== other) expect(Math.hypot(slot.position[0] - other.position[0], slot.position[2] - other.position[2])).toBeGreaterThan(5);
      }
      expect(constrainMuseumPosition(plan, 100, -999)[1]).toBe(plan.backZ + 1);
    }
  });

  it("prevents walking through plinths and preserves a stable proximity label", () => {
    const plan = buildMuseumPlan(landmarks[0]);
    const slot = plan.slots[0];
    const [x, z] = constrainMuseumPosition(plan, slot.position[0], slot.position[2]);
    expect(Math.abs(x - slot.position[0]) >= 1.45 || Math.abs(z - slot.position[2]) >= 1.7).toBe(true);
    expect(selectNearbyExhibit(plan.slots, slot.position[0] + 3.4, slot.position[2], slot.id)?.id).toBe(slot.id);
    expect(selectNearbyExhibit(plan.slots, slot.position[0] + 3.4, slot.position[2], null)).toBeNull();
    expect(selectNearbyExhibit(plan.slots, 0, plan.entranceZ, slot.id)).toBeNull();
  });

  it("stops at a partition without pulling the traveler sideways into the connector", () => {
    const plan = buildMuseumPlan({ ...landmarks[0], exhibits: Array.from({ length: 5 }, (_, i) => ({ ...landmarks[0].exhibits[0], id: `project-${i}` })) });
    const back = plan.rooms[0].centerZ - plan.rooms[0].depth / 2;
    const previous = [4, back + .8] as const;
    expect(constrainMuseumPosition(plan, 4, back + .7, previous)).toEqual([...previous]);
    expect(constrainMuseumPosition(plan, 0, back + .7, [0, back + .8])).toEqual([0, back + .7]);
    expect(constrainMuseumPosition(plan, 3.9, back + .7, previous)).toEqual([3.9, previous[1]]);
  });

  it("keeps explicit display semantics", () => {
    expect(getExhibitKind("observatory", { ...landmarks[1].exhibits[0], presentation: "daily-signal" })).toBe("daily-signal");
    expect(getExhibitKind("memory-grove", { ...landmarks[2].exhibits[0], presentation: "audio-echo" })).toBe("audio-echo");
  });
});
