import { describe, expect, it } from "vitest";
import type { PublicPlayer } from "./protocol";
import { selectStudyCompanions, studySeats } from "./study-presence";

function players(count: number): Record<string, PublicPlayer> {
  return Object.fromEntries(Array.from({ length: count }, (_, i) => {
    const id = `reader-${i}`;
    return [id, { id, color: "#fff", position: [0, 0, 0], rotation: 0, room: "night-study" }];
  }));
}

describe("six study seats", () => {
  it("reserves a fixed self seat and leaves absent companions empty", () => {
    expect(studySeats).toHaveLength(6);
    expect(selectStudyCompanions([], {}, null)).toEqual([null, null, null, null, null]);
    const selected = selectStudyCompanions([], players(3), "reader-0");
    expect(selected.filter(Boolean)).toHaveLength(2);
    expect(selected).not.toContain("reader-0");
  });

  it("randomly samples at most five distinct players actually inside the study", () => {
    const pool = players(20);
    pool["reader-1"].room = "island";
    pool["reader-2"].room = "workshop";
    pool["reader-3"].room = undefined; // Legacy clients cannot claim a study seat.
    const a = selectStudyCompanions([], pool, "reader-0", () => 0);
    const b = selectStudyCompanions([], pool, "reader-0", () => .999);
    expect(a).not.toEqual(b);
    for (const result of [a, b]) {
      expect(result.filter(Boolean)).toHaveLength(5);
      expect(new Set(result).size).toBe(5);
      expect(result.every((id) => id !== "reader-0" && pool[id!].room === "night-study")).toBe(true);
    }
  });

  it("keeps occupied seats stable across movement, appearance and new arrivals", () => {
    const pool = players(8);
    const initial = selectStudyCompanions([], pool, null, () => .4);
    pool[initial[0]!].appearance = { palette: 4, form: 2 };
    pool[initial[0]!].position = [7, 1, 2];
    const joined = { ...pool, ...players(12) };
    expect(selectStudyCompanions(initial, joined, null, () => .9)).toEqual(initial);
  });

  it("replaces only vacated seats on departure and removes duplicates", () => {
    const pool = players(9);
    const initial = selectStudyCompanions([], pool, null, () => .4);
    delete pool[initial[1]!];
    pool[initial[3]!].room = "observatory";
    const next = selectStudyCompanions(initial, pool, null, () => .1);
    expect(next[0]).toBe(initial[0]);
    expect(next[2]).toBe(initial[2]);
    expect(next[4]).toBe(initial[4]);
    expect(next).not.toContain(initial[1]);
    expect(next).not.toContain(initial[3]);
    expect(new Set(selectStudyCompanions(["reader-0", "reader-0"], pool, null)).size).toBe(5);
  });
});
