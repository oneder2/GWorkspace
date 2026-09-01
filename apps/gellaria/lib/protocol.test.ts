import { describe, expect, it } from "vitest";
import { clientMessageSchema } from "./protocol";

describe("multiplayer protocol", () => {
  it("accepts bounded message shapes", () => {
    expect(clientMessageSchema.safeParse({ type: "move", position: [1, 0.7, 2], rotation: 0 }).success).toBe(true);
    expect(clientMessageSchema.safeParse({ type: "signal", landmarkId: "workshop" }).success).toBe(true);
    expect(clientMessageSchema.safeParse({ type: "tag", landmarkId: "workshop", value: "仍在生长" }).success).toBe(true);
  });

  it("rejects malformed and oversized actions", () => {
    expect(clientMessageSchema.safeParse({ type: "move", position: [1, 2], rotation: 0 }).success).toBe(false);
    expect(clientMessageSchema.safeParse({ type: "signal", landmarkId: "x".repeat(41) }).success).toBe(false);
    expect(clientMessageSchema.safeParse({ type: "admin", value: true }).success).toBe(false);
  });
});
