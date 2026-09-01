import { z } from "zod";
import { landmarks as fallbackLandmarks, landmarkExhibitSchema, type Landmark } from "./content";
import { fetchGWorkspace } from "./gworkspace-api";
import { getWorkspacePulse, type WorkspacePulse } from "./gworkspace-pulse";
import { getGWorkspaceResume, type GWorkspaceResume } from "./gworkspace-resume";

const profileSchema = z.object({
  name: z.string(),
  role: z.string(),
  bio: z.string(),
  responsibilities: z.array(z.string()),
  contacts: z.array(z.object({ id: z.string(), label: z.string(), href: z.string() })),
  status: z.string(),
  slogan: z.string(),
  tasks: z.array(z.string()),
  location: z.string().nullable(),
  timezone: z.string().nullable(),
});

const publicWorldSchema = z.object({
  version: z.literal(1),
  locale: z.enum(["zh", "en"]),
  updatedAt: z.string().nullable(),
  profile: profileSchema,
  regions: z.array(z.object({
    id: z.enum(["workshop", "observatory", "memory-grove"]),
    exhibits: z.array(landmarkExhibitSchema).max(6),
  })),
});

export type SiteProfile = z.infer<typeof profileSchema>;
export type WorldContent = {
  landmarks: Landmark[];
  profile: SiteProfile;
  resume: GWorkspaceResume | null;
  source: "gworkspace" | "fallback";
  updatedAt: string | null;
};

export const fallbackProfile: SiteProfile = {
  name: "Eclospy732",
  role: "GWorkspace 站长与维护者",
  bio: "我在这里整理写作、作品和日常工具，也持续调整这个站点本身。GWorkspace 既是公开档案，也是我真正使用的个人工作空间。",
  responsibilities: ["设计并维护 GWorkspace 的页面与交互", "整理写作、独立项目与公开档案", "把个人工作流沉淀为站内工具"],
  contacts: [
    { id: "github", label: "GitHub", href: "https://github.com/oneder2/GWorkspace" },
    { id: "email", label: "eclospy@duck.com", href: "mailto:eclospy@duck.com" },
  ],
  status: "最近在整理这个角落的光线与秩序，让它更接近一处可以久留的个人空间。",
  slogan: "愿这里既能安放好奇，也能容纳尚未说完的话。",
  tasks: [],
  location: null,
  timezone: null,
};

function adaptExhibitHref(exhibit: z.infer<typeof landmarkExhibitSchema>) {
  if (exhibit.sourceType !== "project" || !exhibit.href) return exhibit;
  const match = /^\/portfolio\/([^/?#]+)\/?$/.exec(exhibit.href);
  return match ? { ...exhibit, href: `/portfolio#${encodeURIComponent(match[1])}` } : exhibit;
}

export function mergePublicWorld(payload: unknown, resume: GWorkspaceResume | null = null): WorldContent {
  const parsed = publicWorldSchema.parse(payload);
  const exhibitsByRegion = new Map<string, z.infer<typeof landmarkExhibitSchema>[]>(
    parsed.regions.map((region) => [region.id, region.exhibits.map(adaptExhibitHref)]),
  );
  return {
    landmarks: fallbackLandmarks.map((landmark) => {
      const exhibits = exhibitsByRegion.get(landmark.id);
      return exhibits?.length ? { ...landmark, exhibits } : landmark;
    }),
    profile: resume ? {
      ...parsed.profile,
      name: resume.profile.name,
      role: resume.profile.headline,
      bio: resume.profile.summary,
      location: resume.profile.location || parsed.profile.location,
      contacts: resume.profile.contacts.map((contact) => ({ id: contact.id, label: contact.label, href: contact.url })),
    } : parsed.profile,
    resume,
    source: "gworkspace",
    updatedAt: parsed.updatedAt,
  };
}

function prependExhibit(landmark: Landmark, exhibit: z.infer<typeof landmarkExhibitSchema>): Landmark {
  return {
    ...landmark,
    exhibits: [exhibit, ...landmark.exhibits.filter((item) => item.id !== exhibit.id)].slice(0, 6),
  };
}

export function applyWorkspacePulse(content: WorldContent, pulse: WorkspacePulse): WorldContent {
  let landmarks = content.landmarks;
  const capsule = pulse.dailyCapsule;
  if (capsule?.source_text.trim()) {
    landmarks = landmarks.map((landmark) => landmark.id === "observatory"
      ? prependExhibit(landmark, {
          id: `daily-capsule:${capsule.capsule_date}`,
          sourceType: "external",
          label: "今日赠语",
          title: capsule.greeting || capsule.source_text,
          summary: capsule.thesis || capsule.takeaway || capsule.source_text,
          href: capsule.source_url || "/workspace",
          tags: capsule.source_label ? [capsule.source_label] : [],
          publishedAt: capsule.capsule_date,
        })
      : landmark);
  }

  const track = pulse.nowPlaying;
  if (track?.title.trim()) {
    const trackContext = [track.artist, track.album].filter(Boolean).join(" · ");
    landmarks = landmarks.map((landmark) => landmark.id === "memory-grove"
      ? prependExhibit(landmark, {
          id: `now-playing:${track.title}:${track.artist}`,
          sourceType: "external",
          label: track.isPlaying ? "正在听" : "最近听见",
          title: track.title,
          summary: trackContext || "一段从 GWorkspace 传来的声音。",
          href: track.externalUrl || null,
          image: track.coverUrl || null,
          tags: [],
          publishedAt: null,
        })
      : landmark);
  }

  return { ...content, landmarks };
}

export async function getWorldContent(): Promise<WorldContent> {
  const [response, pulse, resume] = await Promise.all([
    fetchGWorkspace("/api/public/world?locale=zh", { timeoutMs: 3000, revalidate: 60 }),
    getWorkspacePulse(),
    getGWorkspaceResume(),
  ]);
  const fallback: WorldContent = {
    landmarks: fallbackLandmarks,
    profile: resume ? {
      ...fallbackProfile,
      name: resume.profile.name,
      role: resume.profile.headline,
      bio: resume.profile.summary,
      location: resume.profile.location,
      contacts: resume.profile.contacts.map((contact) => ({ id: contact.id, label: contact.label, href: contact.url })),
    } : fallbackProfile,
    resume,
    source: "fallback",
    updatedAt: null,
  };
  if (!response?.ok) return applyWorkspacePulse(fallback, pulse);

  try {
    return applyWorkspacePulse(mergePublicWorld(await response.json(), resume), pulse);
  } catch {
    return applyWorkspacePulse(fallback, pulse);
  }
}
