import { NextRequest } from "next/server";
import { getGWorkspaceApiOrigin } from "@/lib/gworkspace-api";

const publicOrigin = "https://www.gellaronline.cc";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? "";
  if (!path.startsWith("/images/") || path.includes("..")) {
    return Response.json({ error: "Unsupported media path" }, { status: 400 });
  }

  const origins = [...new Set([getGWorkspaceApiOrigin(), process.env.GWORKSPACE_PUBLIC_URL?.trim(), publicOrigin].filter(Boolean))] as string[];
  for (const origin of origins) {
    try {
      const upstream = await fetch(new URL(path, origin), {
        signal: AbortSignal.timeout(3000),
        next: { revalidate: 3600 },
      });
      const contentType = upstream.headers.get("content-type") ?? "";
      if (!upstream.ok || !contentType.startsWith("image/")) continue;
      return new Response(await upstream.arrayBuffer(), {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      });
    } catch {
      // Try the next configured GWorkspace origin.
    }
  }

  return Response.json({ error: "GWorkspace media unavailable" }, { status: 502 });
}
