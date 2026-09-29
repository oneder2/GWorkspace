import { describe, expect, it } from "vitest";
import { artifactSpecSchema } from "./artifact";
import { mergePublicWorld, fallbackProfile, applyWorkspacePulse } from "./gworkspace-content";
import { gworkspaceResumeSchema } from "./gworkspace-resume";
import { buildMuseumPlan } from "./exhibition";
import { landmarks } from "./content";

const spec = artifactSpecSchema.parse({ version: 2, seed: 45, form: "research-desk", zone: "知识与推理", colors: ["#7799bb", "#ccbbaa", "#eeeecc"], proportions: { width: 1, height: 1, depth: 1 }, detail: { count: 4, rings: 2 }, evidence: ["检索"], caption: "以检索透镜转译主题。", featured: false });
const record = { status: "published", surfaces: ["gellaria"], updated_at: "2026-09-27" };
const resume = gworkspaceResumeSchema.parse({
  schema_version: "1.0.0", generated_at: record.updated_at,
  source: { system: "GWorkspace", canonical_url: "https://example.com/api/public/v1/resume", updated_at: record.updated_at },
  locale: "zh", surface: "gellaria",
  profile: { ...record, id: "owner", name: "Gellar", full_name: "Gellar", headline: "开发者", location: "", summary: "简介", avatar: null, contacts: [] },
  skills: [], experience: [], education: [],
  projects: ["bound", "unplaced"].map(slug => ({ ...record, id: `project:${slug}`, slug, name: slug, summary: "摘要", role: "作者", involvement: "creator", start: "2026", end: null, technologies: ["TypeScript"], highlights: ["公开亮点"], links: {}, cover: null, gallery: [], featured: false })),
  settings: { default_language: "zh", pdf: { project_limit: 6, filename: "resume.pdf" } },
});
const bound = { id: "project:bound", sourceKey: "bound", sourceType: "project" as const, label: "项目", title: "检索工具", summary: "公开说明", artifactId: "artifact:stable", artifactSpec: spec, artifactRevision: 3 };

describe("bound museum artifacts", () => {
  it("preserves the world's source selection and binding while enriching resume details", () => {
    const world = { version: 1, locale: "zh", updatedAt: null, profile: fallbackProfile, regions: [{ id: "workshop", exhibits: [bound] }] };
    const merged = mergePublicWorld(world, resume);
    expect(merged.landmarks[0].exhibits).toHaveLength(1);
    expect(merged.landmarks[0].exhibits[0]).toMatchObject({ artifactId: "artifact:stable", artifactRevision: 3, artifactSpec: spec, details: { role: "作者", highlights: ["公开亮点"] } });
    expect(mergePublicWorld({ ...world, regions: [] }, resume).landmarks[0].exhibits).toEqual([]);
  });
  it("does not replace a published bound daily artifact with an unbound pulse", () => {
    const daily = { ...bound, id: "daily-capsule:2026-09-27", sourceType: "external", presentation: "daily-signal" };
    const content = mergePublicWorld({ version: 1, locale: "zh", updatedAt: null, profile: fallbackProfile, regions: [{ id: "observatory", exhibits: [daily] }] });
    const result = applyWorkspacePulse(content, { nowPlaying: null, dailyCapsule: { capsule_date: "2026-09-27", source_text: "text", greeting: "greeting", thesis: "thesis", boundary: "", takeaway: "" } });
    expect(result.landmarks[1].exhibits[0].artifactId).toBe("artifact:stable");
  });
  it("groups topics separately, keeps featured pieces first and leaves an open route", () => {
    const plan = buildMuseumPlan({ ...landmarks[0], exhibits: [bound, { ...bound, id: "book", artifactSpec: { ...spec, zone: "表达与记录", form: "publishing-press" } }, { ...bound, id: "featured", artifactSpec: { ...spec, featured: true } }] });
    expect(plan.rooms.map(room => room.title)).toEqual(["知识与推理", "表达与记录"]);
    expect(plan.slots.map(slot => slot.id)).toEqual(["featured", "project:bound", "book"]);
    // Exhibit footprint plus traveler buffer must stay outside the 4.7-unit
    // central route even when displays are brought closer to the visitor.
    expect(plan.slots.every(slot => Math.abs(slot.position[0]) - 1.45 >= 2.35)).toBe(true);
  });
  it("rejects arbitrary geometry code and unbounded detail", () => {
    expect(artifactSpecSchema.safeParse({ ...spec, form: "eval(js)" }).success).toBe(false);
    expect(artifactSpecSchema.safeParse({ ...spec, detail: { count: 100000, rings: 2 } }).success).toBe(false);
  });
});
