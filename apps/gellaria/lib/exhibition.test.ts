import { describe, expect, it } from "vitest";
import { landmarks } from "./content";
import { buildExhibitSlots, getExhibitAction, getExhibitKind } from "./exhibition";

describe("exhibition planning", () => {
  it("keeps reserved capacity after current exhibits", () => {
    const slots = buildExhibitSlots(landmarks[0]);
    expect(slots).toHaveLength(8);
    expect(slots.filter((slot) => slot.exhibit)).toHaveLength(landmarks[0].exhibits.length);
    expect(slots.at(-1)?.id).toContain("reserved");
  });

  it("maps content types to spatial interactions", () => {
    expect(getExhibitKind("workshop", { ...landmarks[0].exhibits[0], sourceType: "project" })).toBe("project-model");
    expect(getExhibitKind("observatory", { ...landmarks[1].exhibits[0], sourceType: "blog" })).toBe("blog-constellation");
    expect(getExhibitKind("memory-grove", { ...landmarks[2].exhibits[0], sourceType: "guestbook" })).toBe("echo-fragment");
    expect(getExhibitKind("observatory", { ...landmarks[1].exhibits[0], presentation: undefined, sourceType: "external" })).toBe("signal");
    expect(getExhibitKind("observatory", { ...landmarks[1].exhibits[0], id: "daily-capsule:2026-09-06", presentation: "daily-signal" })).toBe("daily-signal");
    expect(getExhibitAction("project-model").destination).toContain("GWorkspace");
  });

  it("gives each hall its own spatial layout", () => {
    const workshop = buildExhibitSlots(landmarks.find((item) => item.id === "workshop")!);
    const observatory = buildExhibitSlots(landmarks.find((item) => item.id === "observatory")!);
    const grove = buildExhibitSlots(landmarks.find((item) => item.id === "memory-grove")!);
    expect(observatory.map((slot) => slot.position)).not.toEqual(workshop.map((slot) => slot.position));
    expect(grove.map((slot) => slot.position)).not.toEqual(workshop.map((slot) => slot.position));
    expect(grove).toHaveLength(landmarks.find((item) => item.id === "memory-grove")!.exhibits.length);
    for (const slots of [workshop, observatory]) {
      expect(slots.every((slot) => Math.abs(slot.position[0]) >= 4.8)).toBe(true);
      expect(slots.some((slot) => slot.position[0] < 0)).toBe(true);
      expect(slots.some((slot) => slot.position[0] > 0)).toBe(true);
    }
    expect(grove.every((slot) => Math.abs(slot.position[0]) >= 3.1)).toBe(true);
    expect(grove.some((slot) => slot.position[0] < 0)).toBe(true);
    expect(grove.some((slot) => slot.position[0] > 0)).toBe(true);
  });
});
