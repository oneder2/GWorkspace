export function getGWorkspaceApiOrigin(): string | null {
  const configured = process.env.GWORKSPACE_API_URL?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === "development" ? "http://127.0.0.1:3001" : null;
}

export async function fetchGWorkspace(
  path: string,
  options: { timeoutMs?: number; revalidate?: number; cache?: RequestCache } = {},
): Promise<Response | null> {
  const origin = getGWorkspaceApiOrigin();
  if (!origin) return null;

  const init: RequestInit & { next?: { revalidate: number } } = {
    signal: AbortSignal.timeout(options.timeoutMs ?? 3000),
  };
  if (options.cache) init.cache = options.cache;
  else init.next = { revalidate: options.revalidate ?? 60 };

  try {
    return await fetch(new URL(path, origin), init);
  } catch {
    return null;
  }
}
