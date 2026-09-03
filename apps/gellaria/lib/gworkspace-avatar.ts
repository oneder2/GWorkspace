import { z } from "zod";
import type { SpiritAppearance } from "./spirit-identity";

export const GELLARIA_SESSION_KEY = "gellaria-workspace-session-v1";

const appearanceSchema = z.object({
  palette: z.number().int().min(0).max(4),
  form: z.number().int().min(0).max(2),
  updatedAt: z.string().optional(),
});

const userSchema = z.object({
  id: z.number().int().positive(),
  username: z.string(),
  role: z.string(),
});

const sessionSchema = z.object({
  token: z.string(),
  expiresAt: z.string(),
  user: userSchema,
  appearance: appearanceSchema.nullable(),
});

const avatarSchema = z.object({
  user: userSchema,
  appearance: appearanceSchema.nullable(),
});

export type GWorkspaceAvatarUser = z.infer<typeof userSchema>;
export type GWorkspaceAvatarSession = z.infer<typeof sessionSchema>;

export function gworkspaceApiUrl(path: string) {
  const configured = process.env.NEXT_PUBLIC_GWORKSPACE_API_URL?.trim();
  const origin = configured || (process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:3001/api"
    : "https://workspace.gellaronline.cc/api");
  return new URL(path.replace(/^\//, ""), `${origin.replace(/\/$/, "")}/`).toString();
}

async function apiRequest(path: string, init: RequestInit, fetcher: typeof fetch = fetch) {
  const response = await fetcher(gworkspaceApiUrl(path), {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`GWorkspace avatar request failed (${response.status})`);
  return response;
}

export async function exchangeGWorkspaceHandoff(code: string, fetcher: typeof fetch = fetch) {
  const response = await apiRequest("gellaria/handoff/exchange", {
    method: "POST",
    body: JSON.stringify({ code }),
  }, fetcher);
  return sessionSchema.parse(await response.json());
}

export async function getGWorkspaceAvatar(token: string, fetcher: typeof fetch = fetch) {
  const response = await apiRequest("gellaria/avatar", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  }, fetcher);
  return avatarSchema.parse(await response.json());
}

export async function saveGWorkspaceAvatar(token: string, appearance: SpiritAppearance, fetcher: typeof fetch = fetch) {
  const response = await apiRequest("gellaria/avatar", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(appearance),
  }, fetcher);
  return avatarSchema.parse(await response.json());
}

export async function revokeGWorkspaceAvatarSession(token: string, fetcher: typeof fetch = fetch) {
  await apiRequest("gellaria/session", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }, fetcher);
}

export function appearanceOnly(value: z.infer<typeof appearanceSchema>): SpiritAppearance {
  return { palette: value.palette, form: value.form };
}
