import { z } from "zod";

const color = z.string().regex(/^#[0-9a-f]{6}$/i);
export const artifactDesignSchema = z.object({
  motif: z.enum(['workspace-orrery', 'citation-bench', 'offline-vault', 'web-periscope', 'twilight-stage', 'resume-typesetter', 'training-balance', 'tidal-planner', 'memory-bridge', 'portfolio-frames', 'simulation-reel', 'civilization-strata', 'composition-tree', 'glass-palimsest', 'frontend-horizon', 'image-aperture', 'data-weave', 'code-prism', 'story-mobile']),
  name: z.string().max(60), rationale: z.string().max(240), parts: z.array(z.string().max(40)).max(6),
  basis: z.enum(['curated-content', 'content-rules', 'document-structure']),
  tier: z.enum(['resume', 'kinetic', 'reading', 'support']),
  level: z.number().int().min(0).max(17), threshold: z.number().nonnegative(), nextThreshold: z.number().positive().nullable(),
  subject: z.string().max(120), synopsis: z.string().max(320), anchors: z.array(z.string().max(100)).max(8),
  structure: z.object({ headings: z.array(z.string().max(100)).max(12), paragraphs: z.number().int().nonnegative(), images: z.number().int().nonnegative(), codeBlocks: z.number().int().nonnegative() }),
  geometry: z.object({ family: z.enum(['torus-knot', 'superformula', 'lissajous']), p: z.number().int().min(2).max(4), q: z.literal(5), lobes: z.number().int().min(3).max(8), phase: z.number().min(0).max(Math.PI * 2) }),
  segments: z.number().int().min(32).max(224), ornaments: z.number().int().min(2).max(56),
  narrative: z.object({ chapters: z.array(z.object({ title: z.string().max(80), excerpt: z.string().max(180) })).max(6), phase: z.enum(['closed', 'subject', 'chapters', 'arguments', 'connections']), relation: z.literal('document-order') }).optional(),
});
export const artifactSpecSchema = z.object({
  version: z.literal(2),
  seed: z.number().int().min(0).max(99999),
  form: z.enum(["world-diorama", "research-desk", "network-switch", "publishing-press", "planning-clock", "mobile-companion", "growth-garden", "travel-lantern", "logic-engine", "folio", "daily-leaf"]),
  zone: z.string().min(1).max(40),
  colors: z.tuple([color, color, color]),
  proportions: z.object({ width: z.number().min(.8).max(1.3), height: z.number().min(.8).max(1.3), depth: z.number().min(.8).max(1.3) }),
  detail: z.object({ count: z.number().int().min(3).max(6), rings: z.number().int().min(1).max(3) }),
  evidence: z.array(z.string().max(32)).max(5),
  caption: z.string().max(240),
  featured: z.boolean(),
  design: artifactDesignSchema.optional(),
});
export type ArtifactDesign = z.infer<typeof artifactDesignSchema>;
export type ArtifactSpec = z.infer<typeof artifactSpecSchema>;
