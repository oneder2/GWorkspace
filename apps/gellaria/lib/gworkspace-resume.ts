import { z } from "zod";
import { RESUME_SCHEMA_VERSION } from "@gworkspace/contracts";
import { fetchGWorkspace } from "./gworkspace-api";

const mediaSchema = z.object({
  id: z.string(),
  url: z.string(),
  mime_type: z.string(),
  alt: z.string().nullable(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
});

const publicRecordSchema = z.object({
  status: z.literal("published"),
  surfaces: z.array(z.enum(["portfolio", "resume_web", "resume_pdf", "gellaria"])),
  updated_at: z.string(),
});

const contactSchema = publicRecordSchema.extend({
  id: z.string(),
  type: z.enum(["email", "phone", "website", "github", "linkedin", "location", "other"]),
  label: z.string(),
  value: z.string(),
  url: z.string(),
});

const timelineSchema = publicRecordSchema.extend({
  id: z.string(),
  kind: z.enum(["employment", "education", "volunteering", "award", "other"]),
  organization: z.string(),
  title: z.string(),
  location: z.string().nullable(),
  summary: z.string(),
  highlights: z.array(z.string()),
  start: z.string(),
  end: z.string().nullable(),
  canonical_url: z.string().nullable(),
});

const projectSchema = publicRecordSchema.extend({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  summary: z.string(),
  role: z.string().nullable(),
  involvement: z.enum(["creator", "contributor", "collaborator"]),
  start: z.string(),
  end: z.string().nullable(),
  technologies: z.array(z.string()),
  highlights: z.array(z.string()),
  links: z.object({
    source: z.string().optional(),
    demo: z.string().optional(),
    case_study: z.string().optional(),
  }),
  cover: mediaSchema.nullable(),
  gallery: z.array(mediaSchema),
  featured: z.boolean(),
});

export const gworkspaceResumeSchema = z.object({
  schema_version: z.literal(RESUME_SCHEMA_VERSION),
  generated_at: z.string(),
  source: z.object({
    system: z.literal("GWorkspace"),
    canonical_url: z.string(),
    updated_at: z.string(),
  }),
  locale: z.literal("zh"),
  surface: z.literal("gellaria"),
  profile: publicRecordSchema.extend({
    id: z.string(),
    name: z.string(),
    full_name: z.string(),
    headline: z.string(),
    location: z.string(),
    summary: z.string(),
    avatar: mediaSchema.nullable(),
    contacts: z.array(contactSchema),
  }),
  skills: z.array(publicRecordSchema.extend({
    id: z.string(),
    name: z.string(),
    items: z.array(z.string()).min(1),
  })),
  experience: z.array(timelineSchema),
  education: z.array(timelineSchema),
  projects: z.array(projectSchema),
  settings: z.object({
    default_language: z.enum(["zh", "en"]),
    pdf: z.object({
      project_limit: z.number().int().positive(),
      filename: z.string(),
    }),
  }),
});

export type GWorkspaceResume = z.infer<typeof gworkspaceResumeSchema>;
export type ResumeProject = z.infer<typeof projectSchema>;

export async function getGWorkspaceResume(): Promise<GWorkspaceResume | null> {
  const response = await fetchGWorkspace(
    "/api/public/v1/resume?locale=zh&surface=gellaria",
    { timeoutMs: 3000, revalidate: 300 },
  );
  if (!response?.ok) return null;
  try {
    const parsed = gworkspaceResumeSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function primaryProjectUrl(project: ResumeProject): string {
  return project.links.demo ?? project.links.case_study ?? project.links.source ?? `/portfolio#${project.slug}`;
}

export function gworkspaceMediaUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith("/images/")) return url;
    return `/api/gworkspace-media?path=${encodeURIComponent(parsed.pathname)}`;
  } catch {
    return url;
  }
}
