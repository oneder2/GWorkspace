"use client";

import { useCallback, useEffect, useState } from "react";
import {
  GELLARIA_SESSION_KEY,
  appearanceOnly,
  exchangeGWorkspaceHandoff,
  getGWorkspaceAvatar,
  revokeGWorkspaceAvatarSession,
  saveGWorkspaceAvatar,
  type GWorkspaceAvatarSession,
  type GWorkspaceAvatarUser,
} from "./gworkspace-avatar";
import type { SpiritAppearance } from "./spirit-identity";
import { workspaceUrl } from "./workspace-url";
import { useWorldStore } from "@/components/world/store";

export type AvatarSyncState = "local" | "connecting" | "synced" | "error";

function loadSession(storage: Storage): GWorkspaceAvatarSession | null {
  try {
    const value = JSON.parse(storage.getItem(GELLARIA_SESSION_KEY) ?? "null") as GWorkspaceAvatarSession | null;
    if (!value?.token || !value.user?.username || Date.parse(value.expiresAt) <= Date.now()) return null;
    return value;
  } catch {
    return null;
  }
}

function storeSession(storage: Storage, session: GWorkspaceAvatarSession) {
  storage.setItem(GELLARIA_SESSION_KEY, JSON.stringify(session));
}

export function useGWorkspaceAvatar() {
  const [session, setSession] = useState<GWorkspaceAvatarSession | null>(null);
  const [syncState, setSyncState] = useState<AvatarSyncState>("local");
  const [message, setMessage] = useState<string | null>(null);
  const setPlayerAppearance = useWorldStore((state) => state.setPlayerAppearance);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const handoff = params.get("handoff");
    if (handoff) {
      params.delete("handoff");
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    }

    const restore = async () => {
      let storage: Storage;
      try { storage = window.localStorage; } catch { return; }
      setSyncState(handoff ? "connecting" : "local");
      try {
        let next = handoff ? await exchangeGWorkspaceHandoff(handoff) : loadSession(storage);
        if (!next) return;
        if (!handoff) {
          const avatar = await getGWorkspaceAvatar(next.token);
          next = { ...next, user: avatar.user, appearance: avatar.appearance };
        }
        if (!next.appearance) {
          const localAppearance = useWorldStore.getState().playerAppearance;
          const avatar = await saveGWorkspaceAvatar(next.token, localAppearance);
          next = { ...next, appearance: avatar.appearance };
        }
        if (!active) return;
        storeSession(storage, next);
        setSession(next);
        if (next.appearance) setPlayerAppearance(appearanceOnly(next.appearance));
        setSyncState("synced");
        setMessage(handoff ? `已连接 ${next.user.username} 的灵体档案` : null);
      } catch {
        if (!active) return;
        storage.removeItem(GELLARIA_SESSION_KEY);
        setSession(null);
        setSyncState(handoff ? "error" : "local");
        setMessage(handoff ? "连接凭证已失效，请重新登录 GWorkspace" : null);
      }
    };
    void restore();
    return () => { active = false; };
  }, [setPlayerAppearance]);

  const save = useCallback(async (appearance: SpiritAppearance) => {
    setPlayerAppearance(appearance);
    if (!session) {
      setSyncState("local");
      setMessage("形象已保存在当前浏览器");
      return;
    }
    setSyncState("connecting");
    try {
      const avatar = await saveGWorkspaceAvatar(session.token, appearance);
      const next = { ...session, user: avatar.user, appearance: avatar.appearance };
      window.localStorage.setItem(GELLARIA_SESSION_KEY, JSON.stringify(next));
      setSession(next);
      setSyncState("synced");
      setMessage("灵体档案已同步到 GWorkspace");
    } catch {
      setSyncState("error");
      setMessage("本地形象已保存，GWorkspace 同步暂时失败");
    }
  }, [session, setPlayerAppearance]);

  const disconnect = useCallback(async () => {
    const token = session?.token;
    window.localStorage.removeItem(GELLARIA_SESSION_KEY);
    setSession(null);
    setSyncState("local");
    setMessage("已断开 GWorkspace，形象仍保存在当前浏览器");
    if (token) {
      try { await revokeGWorkspaceAvatarSession(token); } catch { /* Local revocation is sufficient for this device. */ }
    }
  }, [session]);

  return {
    user: session?.user ?? null as GWorkspaceAvatarUser | null,
    syncState,
    message,
    connectHref: workspaceUrl("/gellaria-connect"),
    save,
    disconnect,
    clearMessage: () => setMessage(null),
  };
}
