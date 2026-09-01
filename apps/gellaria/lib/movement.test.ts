import { describe, expect, it } from "vitest";
import { getCameraRelativeMovement } from "./movement";

describe("camera-relative movement", () => {
  it("maps forward and right to the camera ground plane", () => {
    expect(getCameraRelativeMovement(0, -1, 0, -1)).toEqual([0, -1]);
    expect(getCameraRelativeMovement(1, 0, 0, -1)).toEqual([1, 0]);
  });

  it("rotates input with an angled camera", () => {
    const forward = getCameraRelativeMovement(0, -1, -1, -1);
    const right = getCameraRelativeMovement(1, 0, -1, -1);

    expect(forward[0]).toBeCloseTo(-Math.SQRT1_2);
    expect(forward[1]).toBeCloseTo(-Math.SQRT1_2);
    expect(right[0]).toBeCloseTo(Math.SQRT1_2);
    expect(right[1]).toBeCloseTo(-Math.SQRT1_2);
  });

  it("normalizes diagonal input", () => {
    const [x, z] = getCameraRelativeMovement(1, -1, 0, -1);
    expect(Math.hypot(x, z)).toBeCloseTo(1);
  });
});
