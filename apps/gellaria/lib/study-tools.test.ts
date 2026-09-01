import { describe, expect, it } from "vitest";
import { formatTimer, getRemainingTimerSeconds, initialCalculatorState, pressCalculatorKey, type CalculatorKey } from "./study-tools";

function press(keys: CalculatorKey[]) {
  return keys.reduce(pressCalculatorKey, initialCalculatorState);
}

describe("study tools", () => {
  it("formats timer values without allowing negative time", () => {
    expect(formatTimer(1500)).toBe("25:00");
    expect(formatTimer(61.9)).toBe("01:01");
    expect(formatTimer(-4)).toBe("00:00");
  });

  it("derives timer time from an absolute deadline", () => {
    expect(getRemainingTimerSeconds(26_000, 1_000)).toBe(25);
    expect(getRemainingTimerSeconds(26_000, 1_250)).toBe(25);
    expect(getRemainingTimerSeconds(26_000, 26_001)).toBe(0);
  });

  it("performs chained calculator operations", () => {
    expect(press(["1", "2", "+", "8", "="]).display).toBe("20");
    expect(press(["9", "×", "3", "-", "2", "="]).display).toBe("25");
  });

  it("supports decimal, sign and percent controls", () => {
    expect(press(["5", ".", "5", "+/-"]).display).toBe("-5.5");
    expect(press(["5", "0", "%"]).display).toBe("0.5");
  });

  it("returns an error for division by zero and recovers on number input", () => {
    const error = press(["8", "÷", "0", "="]);
    expect(error.display).toBe("Error");
    expect(pressCalculatorKey(error, "4").display).toBe("4");
  });
});
