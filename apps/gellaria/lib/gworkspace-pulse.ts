import { z } from "zod";
import { fetchGWorkspace } from "./gworkspace-api";

const dailyCapsuleSchema = z.object({
  capsule_date: z.string(),
  source_text: z.string(),
  source_label: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  greeting: z.string(),
  thesis: z.string(),
  boundary: z.string().optional().default(""),
  takeaway: z.string().optional().default(""),
});

const nowPlayingSchema = z.object({
  title: z.string(),
  artist: z.string().optional().default(""),
  album: z.string().optional().default(""),
  coverUrl: z.string().optional().default(""),
  externalUrl: z.string().optional().default(""),
  isPlaying: z.boolean().optional().default(false),
});

export type WorkspacePulse = {
  dailyCapsule: z.infer<typeof dailyCapsuleSchema> | null;
  nowPlaying: z.infer<typeof nowPlayingSchema> | null;
};

async function readPulseRecord<T>(response: Response | null, schema: z.ZodType<T>): Promise<T | null> {
  if (!response?.ok) return null;
  const parsed = schema.safeParse(await response.json().catch(() => null));
  return parsed.success ? parsed.data : null;
}

export async function getWorkspacePulse(): Promise<WorkspacePulse> {
  const [capsuleResponse, nowPlayingResponse] = await Promise.all([
    fetchGWorkspace("/api/ai/daily-capsule", { timeoutMs: 3500, revalidate: 300 }),
    fetchGWorkspace("/api/spotify/now-playing", { timeoutMs: 3500, cache: "no-store" }),
  ]);

  const [dailyCapsule, nowPlaying] = await Promise.all([
    readPulseRecord(capsuleResponse, dailyCapsuleSchema),
    readPulseRecord(nowPlayingResponse, nowPlayingSchema),
  ]);

  return { dailyCapsule, nowPlaying };
}
