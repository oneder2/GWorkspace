"use client";

import { create } from "zustand";
import type { PublicPlayer, ServerMessage } from "@/lib/protocol";
import { loadSpiritIdentity, spiritPalette, type SpiritAppearance, type SpiritIdentity } from "@/lib/spirit-identity";

type ConnectionState = "connecting" | "online" | "offline";

type WorldStore = {
  socket: WebSocket | null;
  playerId: string | null;
  playerColor: string;
  playerAppearance: SpiritAppearance;
  players: Record<string, PublicPlayer>;
  signals: Record<string, number>;
  tags: Record<string, Record<string, number>>;
  connection: ConnectionState;
  notice: string | null;
  connect: () => () => void;
  sendMove: (position: [number, number, number], rotation: number) => void;
  sendSignal: (landmarkId: string) => void;
  sendTag: (landmarkId: string, value: string) => void;
  clearNotice: () => void;
};

let lastMoveSent = 0;
let sessionIdentity: SpiritIdentity | null = null;

export const useWorldStore = create<WorldStore>((set, get) => ({
  socket: null,
  playerId: null,
  playerColor: "#f2a66f",
  playerAppearance: { palette: 0, form: 0 },
  players: {},
  signals: {},
  tags: {},
  connection: "connecting",
  notice: null,
  connect: () => {
    let disposed = false;
    let reconnectTimer: number | undefined;
    let activeSocket: WebSocket | null = null;

    const openSocket = () => {
      if (disposed) return;
      if (!sessionIdentity) {
        let storage: Storage | null = null;
        try { storage = window.localStorage; } catch { storage = null; }
        sessionIdentity = loadSpiritIdentity(storage, () => crypto.randomUUID());
      }
      const appearance = { palette: sessionIdentity.palette, form: sessionIdentity.form };
      const query = new URLSearchParams({
        visitor: sessionIdentity.visitorId,
        palette: String(appearance.palette),
        form: String(appearance.form),
      });
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(`${protocol}//${window.location.host}/ws/gellaria?${query}`);
      activeSocket = socket;
      set({ socket, connection: "connecting", playerAppearance: appearance, playerColor: spiritPalette(appearance).glow });

      socket.addEventListener("open", () => {
        if (!disposed && activeSocket === socket) set({ socket, connection: "online" });
      });
      socket.addEventListener("close", () => {
        if (activeSocket !== socket) return;
        activeSocket = null;
        set((state) => state.socket === socket
          ? { connection: "offline", socket: null, players: {} }
          : state);
        if (!disposed) reconnectTimer = window.setTimeout(openSocket, 2200);
      });
      socket.addEventListener("error", () => {
        if (!disposed && activeSocket === socket) set({ connection: "offline" });
      });
      socket.addEventListener("message", (event) => {
      if (disposed || activeSocket !== socket) return;
      const message = JSON.parse(event.data) as ServerMessage;
      if (message.type === "welcome") {
        set({
          playerId: message.id,
          playerColor: spiritPalette(appearance).glow,
          playerAppearance: appearance,
          players: Object.fromEntries(message.players.map((player) => [player.id, player])),
          signals: message.world.signals,
          tags: message.world.tags,
        });
      }
      if (message.type === "joined") {
        set((state) => ({ players: { ...state.players, [message.player.id]: message.player } }));
      }
      if (message.type === "moved") {
        set((state) => {
          const existing = state.players[message.id];
          if (!existing) return state;
          return {
            players: {
              ...state.players,
              [message.id]: { ...existing, position: message.position, rotation: message.rotation },
            },
          };
        });
      }
      if (message.type === "left") {
        set((state) => {
          const players = { ...state.players };
          delete players[message.id];
          return { players };
        });
      }
      if (message.type === "signal") {
        set((state) => ({
          signals: { ...state.signals, [message.landmarkId]: message.count },
          notice: message.actorId === state.playerId ? "你的光迹已经留在这里" : "远处有一枚新信标亮起",
        }));
      }
      if (message.type === "tag") {
        set((state) => ({
          tags: {
            ...state.tags,
            [message.landmarkId]: {
              ...state.tags[message.landmarkId],
              [message.value]: message.count,
            },
          },
          notice: message.actorId === state.playerId ? `你留下了「${message.value}」` : "远处的地标多了一枚新标签",
        }));
      }
      if (message.type === "error") set({ notice: message.message });
      });
    };

    openSocket();

    return () => {
      disposed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      const socket = activeSocket;
      activeSocket = null;
      socket?.close();
      set((state) => state.socket === socket
        ? { socket: null, connection: "offline", players: {} }
        : state);
    };
  },
  sendMove: (position, rotation) => {
    const now = performance.now();
    const socket = get().socket;
    if (!socket || socket.readyState !== WebSocket.OPEN || now - lastMoveSent < 80) return;
    lastMoveSent = now;
    socket.send(JSON.stringify({ type: "move", position, rotation }));
  },
  sendSignal: (landmarkId) => {
    const socket = get().socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      set({ notice: "目前处于离线状态，信标暂时无法保存" });
      return;
    }
    socket.send(JSON.stringify({ type: "signal", landmarkId }));
  },
  sendTag: (landmarkId, value) => {
    const socket = get().socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      set({ notice: "目前处于离线状态，标签暂时无法保存" });
      return;
    }
    socket.send(JSON.stringify({ type: "tag", landmarkId, value }));
  },
  clearNotice: () => set({ notice: null }),
}));
