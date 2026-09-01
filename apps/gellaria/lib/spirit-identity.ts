export const SPIRIT_STORAGE_KEY = "gellaria-spirit-v1";

export const spiritPalettes = [
  { body: "#d8efe1", glow: "#8dd7b2", face: "#17332f" },
  { body: "#e3edf8", glow: "#8fc7ee", face: "#172d3c" },
  { body: "#f5e1c6", glow: "#efaa72", face: "#42271f" },
  { body: "#eee2f2", glow: "#d5a5df", face: "#38243d" },
  { body: "#edf0c9", glow: "#c9d77c", face: "#303619" },
] as const;

export const spiritForms = ["halo", "comet", "sprout"] as const;

export type SpiritIdentity = {
  version: 1;
  visitorId: string;
  palette: number;
  form: number;
};

export type SpiritAppearance = Pick<SpiritIdentity, "palette" | "form">;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSpiritIdentity(visitorId: string): SpiritIdentity {
  const seed = hashSeed(visitorId);
  return {
    version: 1,
    visitorId,
    palette: seed % spiritPalettes.length,
    form: Math.floor(seed / spiritPalettes.length) % spiritForms.length,
  };
}

export function isSpiritIdentity(value: unknown): value is SpiritIdentity {
  if (!value || typeof value !== "object") return false;
  const identity = value as Partial<SpiritIdentity>;
  return identity.version === 1
    && typeof identity.visitorId === "string"
    && /^[A-Za-z0-9-]{8,64}$/.test(identity.visitorId)
    && Number.isInteger(identity.palette)
    && Number(identity.palette) >= 0
    && Number(identity.palette) < spiritPalettes.length
    && Number.isInteger(identity.form)
    && Number(identity.form) >= 0
    && Number(identity.form) < spiritForms.length;
}

export function loadSpiritIdentity(storage: StorageLike | null, createVisitorId: () => string): SpiritIdentity {
  if (storage) {
    try {
      const existing = JSON.parse(storage.getItem(SPIRIT_STORAGE_KEY) ?? "null");
      if (isSpiritIdentity(existing)) return existing;
    } catch {
      // A blocked or malformed local store should not prevent offline exploration.
    }
  }

  const identity = createSpiritIdentity(createVisitorId());
  if (storage) {
    try {
      storage.setItem(SPIRIT_STORAGE_KEY, JSON.stringify(identity));
    } catch {
      // The in-memory identity still remains stable for this page session.
    }
  }
  return identity;
}

export function spiritIdentityFromSearchParams(params: URLSearchParams, fallbackKey: string): SpiritIdentity {
  const candidate = {
    version: 1,
    visitorId: params.get("visitor") ?? "",
    palette: Number(params.get("palette")),
    form: Number(params.get("form")),
  };
  return isSpiritIdentity(candidate) ? candidate : createSpiritIdentity(fallbackKey);
}

export function spiritPalette(appearance: SpiritAppearance) {
  return spiritPalettes[appearance.palette] ?? spiritPalettes[0];
}
