import { describe, expect, it } from "vitest";
import { gworkspaceMediaUrl, gworkspaceResumeSchema, primaryProjectUrl, type ResumeProject } from "./gworkspace-resume";

const record = {
  status: "published" as const,
  surfaces: ["gellaria"] as ("gellaria" | "portfolio" | "resume_web" | "resume_pdf")[],
  updated_at: "2026-08-31T10:00:00.000Z",
};

describe("GWorkspace resume v1 adapter", () => {
  it("accepts the localized gellaria projection", () => {
    const parsed = gworkspaceResumeSchema.parse({
      schema_version: "1.0.0",
      generated_at: record.updated_at,
      source: { system: "GWorkspace", canonical_url: "https://example.test/api/public/v1/resume", updated_at: record.updated_at },
      locale: "zh",
      surface: "gellaria",
      profile: { ...record, id: "profile:owner", name: "Gellar", full_name: "Muyao Niu", headline: "开发者", location: "美国", summary: "简介", avatar: null, contacts: [] },
      skills: [],
      experience: [],
      education: [],
      projects: [],
      settings: { default_language: "zh", pdf: { project_limit: 6, filename: "resume.pdf" } },
    });
    expect(parsed.surface).toBe("gellaria");
  });

  it("chooses a usable project link in display priority order", () => {
    const project: ResumeProject = {
      id: "project:test", slug: "test", name: "Test", summary: "Summary", role: null,
      involvement: "creator", start: "2026", end: null, technologies: [], highlights: [],
      links: { source: "https://github.com/example/test", demo: "https://example.test" }, cover: null,
      gallery: [], featured: true, ...record,
    };
    expect(primaryProjectUrl(project)).toBe("https://example.test");
  });

  it("keeps GWorkspace images on the Gellaria origin", () => {
    expect(gworkspaceMediaUrl("https://www.gellaronline.cc/images/profile/avatar.jpg")).toBe("/api/gworkspace-media?path=%2Fimages%2Fprofile%2Favatar.jpg");
    expect(gworkspaceMediaUrl("https://cdn.example.test/avatar.jpg")).toBe("https://cdn.example.test/avatar.jpg");
  });
});
