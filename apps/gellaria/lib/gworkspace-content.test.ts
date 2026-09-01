import { describe, expect, it } from "vitest";
import { applyWorkspacePulse, fallbackProfile, mergePublicWorld } from "./gworkspace-content";

describe("GWorkspace public world adapter", () => {
  it("replaces populated region exhibits while retaining empty-region fallbacks", () => {
    const content = mergePublicWorld({
      version: 1,
      locale: "zh",
      updatedAt: "2026-08-30T00:00:00.000Z",
      profile: fallbackProfile,
      regions: [
        {
          id: "workshop",
          exhibits: [{
            id: "project:gworkspace",
            sourceType: "project",
            label: "正在维护",
            title: "GWorkspace",
            summary: "真实项目记录",
            href: "/workspace",
            image: null,
            tags: ["Vue 3"],
            publishedAt: null,
          }],
        },
        { id: "observatory", exhibits: [] },
        { id: "memory-grove", exhibits: [] },
      ],
    });

    expect(content.source).toBe("gworkspace");
    expect(content.resume).toBeNull();
    expect(content.landmarks[0].exhibits[0].id).toBe("project:gworkspace");
    expect(content.landmarks[1].exhibits.length).toBeGreaterThan(0);
  });

  it("rejects unknown region contracts", () => {
    expect(() => mergePublicWorld({ version: 1, locale: "zh", updatedAt: null, profile: fallbackProfile, regions: [{ id: "void", exhibits: [] }] })).toThrow();
  });

  it("adapts legacy GWorkspace project detail paths to project archive anchors", () => {
    const content = mergePublicWorld({
      version: 1,
      locale: "zh",
      updatedAt: null,
      profile: fallbackProfile,
      regions: [
        { id: "workshop", exhibits: [{ id: "project:vana", sourceType: "project", label: "项目", title: "Vana", summary: "项目摘要", href: "/portfolio/vana" }] },
        { id: "observatory", exhibits: [] },
        { id: "memory-grove", exhibits: [] },
      ],
    });
    expect(content.landmarks[0].exhibits[0].href).toBe("/portfolio#vana");
  });

  it("projects public GWorkspace pulse records into their matching regions", () => {
    const content = mergePublicWorld({
      version: 1,
      locale: "zh",
      updatedAt: null,
      profile: fallbackProfile,
      regions: [
        { id: "workshop", exhibits: [] },
        { id: "observatory", exhibits: [] },
        { id: "memory-grove", exhibits: [] },
      ],
    });
    const enriched = applyWorkspacePulse(content, {
      dailyCapsule: {
        capsule_date: "2026-08-31",
        source_text: "测试命题",
        source_label: "test-source",
        source_url: "https://example.com/source",
        greeting: "今日赠语",
        thesis: "一条公开命题。",
        boundary: "",
        takeaway: "",
      },
      nowPlaying: {
        title: "Night Signal",
        artist: "Gellar",
        album: "Field Notes",
        coverUrl: "https://example.com/cover.jpg",
        externalUrl: "https://example.com/track",
        isPlaying: true,
      },
    });

    expect(enriched.landmarks.find((item) => item.id === "observatory")?.exhibits[0]).toMatchObject({
      id: "daily-capsule:2026-08-31",
      title: "今日赠语",
    });
    expect(enriched.landmarks.find((item) => item.id === "memory-grove")?.exhibits[0]).toMatchObject({
      label: "正在听",
      title: "Night Signal",
    });
    expect(enriched.landmarks.every((item) => item.exhibits.length <= 6)).toBe(true);
  });
});
