import { describe, expect, it } from "vitest";
import { SPIRIT_STORAGE_KEY, loadSpiritIdentity, saveSpiritAppearance, spiritIdentityFromSearchParams } from "./spirit-identity";

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial) values.set(SPIRIT_STORAGE_KEY, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("spirit identity", () => {
  it("reuses the same appearance across reconnects", () => {
    const storage = memoryStorage();
    const first = loadSpiritIdentity(storage, () => "visitor-0001");
    const second = loadSpiritIdentity(storage, () => "visitor-9999");
    expect(second).toEqual(first);
  });

  it("replaces malformed storage with a valid stable identity", () => {
    const storage = memoryStorage('{"palette":99}');
    const identity = loadSpiritIdentity(storage, () => "visitor-0002");
    expect(identity.visitorId).toBe("visitor-0002");
    expect(identity.palette).toBeGreaterThanOrEqual(0);
    expect(identity.form).toBeGreaterThanOrEqual(0);
  });

  it("accepts only bounded query appearances", () => {
    const valid = spiritIdentityFromSearchParams(new URLSearchParams("visitor=visitor-0003&palette=2&form=1"), "fallback");
    expect(valid).toMatchObject({ visitorId: "visitor-0003", palette: 2, form: 1 });
    const fallback = spiritIdentityFromSearchParams(new URLSearchParams("visitor=x&palette=20&form=9"), "stable-fallback");
    expect(fallback).toEqual(spiritIdentityFromSearchParams(new URLSearchParams(), "stable-fallback"));
  });

  it("updates appearance without replacing the visitor identity", () => {
    const storage = memoryStorage();
    const identity = loadSpiritIdentity(storage, () => "visitor-0004");
    const updated = saveSpiritAppearance(identity, { palette: 4, form: 2 }, storage);
    expect(updated).toMatchObject({ visitorId: "visitor-0004", palette: 4, form: 2 });
    expect(loadSpiritIdentity(storage, () => "visitor-9999")).toEqual(updated);
  });
});
