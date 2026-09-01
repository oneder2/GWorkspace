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
    expect(getExhibitKind("workshop", { ...landmarks[0].exhibits[0], sourceType: "project" })).toBe("prototype");
    expect(getExhibitKind("observatory", { ...landmarks[1].exhibits[0], sourceType: "blog" })).toBe("constellation");
    expect(getExhibitKind("memory-grove", { ...landmarks[2].exhibits[0], sourceType: "guestbook" })).toBe("echo");
    expect(getExhibitKind("observatory", { ...landmarks[1].exhibits[0], sourceType: "external" })).toBe("signal");
    expect(getExhibitAction("prototype").destination).toContain("GWorkspace");
  });

  it("gives each hall its own spatial layout", () => {
    const workshop = buildExhibitSlots(landmarks.find((item) => item.id === "workshop")!);
    const observatory = buildExhibitSlots(landmarks.find((item) => item.id === "observatory")!);
    const grove = buildExhibitSlots(landmarks.find((item) => item.id === "memory-grove")!);
    expect(observatory.map((slot) => slot.position)).not.toEqual(workshop.map((slot) => slot.position));
    expect(grove.map((slot) => slot.position)).not.toEqual(workshop.map((slot) => slot.position));
    for (const slot of observatory) {
      const orbit = (slot.position[0] / 5.35) ** 2 + ((slot.position[2] + 0.75) / 4.45) ** 2;
      expect(orbit).toBeCloseTo(1, 5);
    }
  });
});
