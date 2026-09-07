import { z } from "zod";

export const projectModelSpecSchema = z.object({
  version: z.literal(1),
  seed: z.number().int().min(0).max(99999),
  archetype: z.enum(["orbital-core", "stacked-tower", "bridge-network", "signal-array", "archive-engine"]),
  material: z.enum(["brass", "ceramic", "glass", "graphite", "alloy"]),
  motion: z.enum(["orbit", "counterspin", "pulse", "scan", "breathe"]),
  primary: z.string().regex(/^#[0-9a-f]{6}$/i),
  secondary: z.string().regex(/^#[0-9a-f]{6}$/i),
  glow: z.string().regex(/^#[0-9a-f]{6}$/i),
  complexity: z.number().int().min(2).max(5),
  elements: z.object({
    rings: z.number().int().min(0).max(3),
    towers: z.number().int().min(0).max(4),
    satellites: z.number().int().min(2).max(6),
    bridges: z.number().int().min(1).max(4),
  }),
  narrative: z.string().max(180),
});

export type ProjectModelSpec = z.infer<typeof projectModelSpecSchema>;

const archetypes = ["orbital-core", "stacked-tower", "bridge-network", "signal-array", "archive-engine"] as const;
const materials = ["brass", "ceramic", "glass", "graphite", "alloy"] as const;
const motions = ["orbit", "counterspin", "pulse", "scan", "breathe"] as const;
const palettes = [
  ["#d77a52", "#8ba69d", "#ffd08a"],
  ["#8aa8be", "#d0a86d", "#bfe8f0"],
  ["#a990c2", "#7ca69b", "#dfcbff"],
  ["#d4a95f", "#768baf", "#ffe0a0"],
  ["#7eaa88", "#b68372", "#bff0c7"],
] as const;

export function stableModelSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) % 100000;
}

export function deriveProjectModelSpec({ slug, title, summary = "", technologies = [] }: {
  slug: string;
  title: string;
  summary?: string;
  technologies?: string[];
}): ProjectModelSpec {
  const seed = stableModelSeed([slug, title, summary, ...technologies].join("|"));
  const text = [slug, title, summary, ...technologies].join(" ").toLowerCase();
  const archetype = /ai|model|data|research|cite|search/.test(text)
    ? "signal-array"
    : /mobile|flutter|app|fitness|health/.test(text)
      ? "orbital-core"
      : /writing|blog|resume|archive|content/.test(text)
        ? "archive-engine"
        : /api|network|connect|cloud|web/.test(text)
          ? "bridge-network"
          : archetypes[seed % archetypes.length];
  const palette = palettes[(seed >>> 3) % palettes.length];
  return {
    version: 1,
    seed,
    archetype,
    material: materials[(seed >>> 5) % materials.length],
    motion: motions[(seed >>> 7) % motions.length],
    primary: palette[0],
    secondary: palette[1],
    glow: palette[2],
    complexity: 2 + (seed % 4),
    elements: {
      rings: seed % 4,
      towers: (seed >>> 2) % 5,
      satellites: 2 + ((seed >>> 4) % 5),
      bridges: 1 + ((seed >>> 6) % 4),
    },
    narrative: `${title} 的结构由项目语义与技术栈生成。`,
  };
}
