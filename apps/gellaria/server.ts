import { createServer } from "node:http";
import next from "next";
import { WebSocket, WebSocketServer } from "ws";
import { createHash, randomUUID } from "node:crypto";
import { clientMessageSchema, type PublicPlayer, type ServerMessage } from "./lib/protocol";
import { addSignal, addTag, getSignals, getTags } from "./lib/world-store";
import { landmarks } from "./lib/content";
import { spiritIdentityFromSearchParams, spiritPalette } from "./lib/spirit-identity";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const landmarkIds = new Set(landmarks.map((landmark) => landmark.id));
const landmarkTags = new Map(landmarks.map((landmark) => [landmark.id, new Set(landmark.tagOptions)]));
const maximumClients = Number(process.env.GELLARIA_MAX_CLIENTS ?? 120);
const maximumClientsPerAddress = Number(process.env.GELLARIA_MAX_CLIENTS_PER_ADDRESS ?? 6);
const configuredOrigins = process.env.GELLARIA_ALLOWED_ORIGINS?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
const allowedOrigins = new Set([
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NEXT_PUBLIC_GWORKSPACE_URL,
  ...configuredOrigins,
].filter((value): value is string => Boolean(value)).map((value) => new URL(value).origin));

await app.prepare();

const server = createServer((request, response) => handle(request, response));
type WorldSocket = WebSocket & { isAlive?: boolean };

const socketServer = new WebSocketServer({ noServer: true, maxPayload: 8 * 1024 });
const clients = new Map<WebSocket, PublicPlayer>();
const addressConnections = new Map<string, number>();

function clientAddress(request: import("node:http").IncomingMessage) {
  return request.headers["x-real-ip"]?.toString()
    ?? request.headers["x-forwarded-for"]?.toString().split(",").at(-1)?.trim()
    ?? request.socket.remoteAddress
    ?? "unknown";
}

function acceptsOrigin(request: import("node:http").IncomingMessage) {
  const origin = request.headers.origin;
  if (!origin) return dev;
  if (dev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return allowedOrigins.has(origin);
}

function send(socket: WebSocket, message: ServerMessage) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function broadcast(message: ServerMessage, except?: WebSocket) {
  for (const socket of clients.keys()) if (socket !== except) send(socket, message);
}

socketServer.on("connection", (socket, request) => {
  const address = clientAddress(request);
  const visitorKey = createHash("sha256")
    .update(address)
    .digest("hex")
    .slice(0, 24);
  const activeForAddress = addressConnections.get(visitorKey) ?? 0;
  if (clients.size >= maximumClients || activeForAddress >= maximumClientsPerAddress) {
    socket.close(1013, "展馆当前人数已满，请稍后再试");
    return;
  }
  addressConnections.set(visitorKey, activeForAddress + 1);
  const worldSocket = socket as WorldSocket;
  worldSocket.isAlive = true;
  socket.on("pong", () => { worldSocket.isAlive = true; });
  let messageWindowStartedAt = Date.now();
  let messageCount = 0;
  const requestUrl = new URL(request.url ?? "/ws/gellaria", "http://gellaria.local");
  const spiritIdentity = spiritIdentityFromSearchParams(requestUrl.searchParams, visitorKey);
  const appearance = { palette: spiritIdentity.palette, form: spiritIdentity.form };
  const player: PublicPlayer = {
    id: randomUUID().slice(0, 8),
    color: spiritPalette(appearance).glow,
    appearance,
    position: [0, 0.7, 5],
    rotation: 0,
  };
  clients.set(socket, player);
  send(socket, {
    type: "welcome",
    id: player.id,
    color: player.color,
    players: [...clients.values()].filter((item) => item.id !== player.id),
    world: { signals: getSignals(), tags: getTags() },
  });
  broadcast({ type: "joined", player }, socket);

  socket.on("message", (raw) => {
    const now = Date.now();
    if (now - messageWindowStartedAt >= 1000) {
      messageWindowStartedAt = now;
      messageCount = 0;
    }
    messageCount += 1;
    if (messageCount > 40) {
      socket.close(1008, "行动频率过高");
      return;
    }
    let payload: unknown;
    try {
      payload = JSON.parse(raw.toString());
    } catch {
      send(socket, { type: "error", message: "无法识别这次行动" });
      return;
    }
    const parsed = clientMessageSchema.safeParse(payload);
    if (!parsed.success) return send(socket, { type: "error", message: "无法识别这次行动" });

    if (parsed.data.type === "move") {
      const [x, y, z] = parsed.data.position;
      if (Math.abs(x) > 24 || Math.abs(z) > 24 || y < -2 || y > 5) return;
      player.position = [x, y, z];
      player.rotation = parsed.data.rotation;
      broadcast({ type: "moved", id: player.id, position: player.position, rotation: player.rotation }, socket);
      return;
    }

    if (!landmarkIds.has(parsed.data.landmarkId)) {
      send(socket, { type: "error", message: "这座地标并不存在" });
      return;
    }
    if (parsed.data.type === "tag") {
      if (!landmarkTags.get(parsed.data.landmarkId)?.has(parsed.data.value)) {
        send(socket, { type: "error", message: "这里没有这样的标签" });
        return;
      }
      const count = addTag(visitorKey, parsed.data.landmarkId, parsed.data.value);
      if (count === null) {
        send(socket, { type: "error", message: "你今天已经标记过这座地标" });
        return;
      }
      broadcast({ type: "tag", landmarkId: parsed.data.landmarkId, value: parsed.data.value, count, actorId: player.id });
      return;
    }
    const count = addSignal(visitorKey, parsed.data.landmarkId);
    if (count === null) {
      send(socket, { type: "error", message: "这座地标刚刚回应过你，请稍后再试" });
      return;
    }
    broadcast({ type: "signal", landmarkId: parsed.data.landmarkId, count, actorId: player.id });
  });

  socket.on("close", () => {
    clients.delete(socket);
    const remaining = (addressConnections.get(visitorKey) ?? 1) - 1;
    if (remaining > 0) addressConnections.set(visitorKey, remaining);
    else addressConnections.delete(visitorKey);
    broadcast({ type: "left", id: player.id });
  });
});

const heartbeat = setInterval(() => {
  for (const socket of clients.keys()) {
    const worldSocket = socket as WorldSocket;
    if (worldSocket.isAlive === false) {
      socket.terminate();
      continue;
    }
    worldSocket.isAlive = false;
    socket.ping();
  }
}, 30_000);
heartbeat.unref();

server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url ?? "/", "http://gellaria.local").pathname;
  if (pathname !== "/ws/gellaria" && pathname !== "/ws/world") {
    socket.destroy();
    return;
  }
  if (!acceptsOrigin(request)) {
    socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }
  socketServer.handleUpgrade(request, socket, head, (webSocket) => {
    socketServer.emit("connection", webSocket, request);
  });
});

server.on("close", () => clearInterval(heartbeat));

server.listen(port, hostname, () => {
  console.log(`Gellaria is listening on http://${hostname}:${port}`);
});
