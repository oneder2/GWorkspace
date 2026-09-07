import { describe, expect, it } from "vitest";
import { deriveProjectModelSpec, projectModelSpecSchema, stableModelSeed } from "./project-model";

describe("project model specifications", () => {
  it("creates a stable but project-specific rendering recipe", () => {
    const first = deriveProjectModelSpec({ slug: "citeai", title: "CiteAI", technologies: ["AI", "Research"] });
    const repeated = deriveProjectModelSpec({ slug: "citeai", title: "CiteAI", technologies: ["AI", "Research"] });
    const other = deriveProjectModelSpec({ slug: "fitness", title: "Fitness App", technologies: ["Flutter"] });
    expect(first).toEqual(repeated);
    expect(first.seed).not.toBe(other.seed);
    expect(first.archetype).toBe("signal-array");
    expect(other.archetype).toBe("orbital-core");
    expect(projectModelSpecSchema.safeParse(first).success).toBe(true);
  });

  it("keeps hash values inside the public model range", () => {
    expect(stableModelSeed("Gellaria")).toBeGreaterThanOrEqual(0);
    expect(stableModelSeed("Gellaria")).toBeLessThan(100000);
  });
});
