import { describe, expect, it } from "vitest";
import { exchangeGWorkspaceHandoff, getGWorkspaceAvatar, gworkspaceApiUrl, saveGWorkspaceAvatar } from "./gworkspace-avatar";

const user = { id: 7, username: "gellar", role: "admin" };

describe("GWorkspace avatar client", () => {
  it("keeps avatar endpoints under the configured API root", () => {
    expect(gworkspaceApiUrl("gellaria/avatar")).toContain("/api/gellaria/avatar");
  });

  it("exchanges handoffs and validates scoped avatar responses", async () => {
    const fetcher = async () => new Response(JSON.stringify({
      token: "session-token",
      expiresAt: "2026-10-01T00:00:00.000Z",
      user,
      appearance: { palette: 3, form: 2, updatedAt: "2026-09-02T00:00:00.000Z" },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
    await expect(exchangeGWorkspaceHandoff("handoff", fetcher as typeof fetch)).resolves.toMatchObject({
      user,
      appearance: { palette: 3, form: 2 },
    });
  });

  it("reads and writes bounded appearances", async () => {
    const fetcher = async (_input: URL | RequestInfo, init?: RequestInit) => new Response(JSON.stringify({
      user,
      appearance: init?.method === "PUT" ? JSON.parse(String(init.body)) : { palette: 1, form: 0 },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
    await expect(getGWorkspaceAvatar("token", fetcher as typeof fetch)).resolves.toMatchObject({ appearance: { palette: 1, form: 0 } });
    await expect(saveGWorkspaceAvatar("token", { palette: 4, form: 2 }, fetcher as typeof fetch)).resolves.toMatchObject({ appearance: { palette: 4, form: 2 } });
  });
});
