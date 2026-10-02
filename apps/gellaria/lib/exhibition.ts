import type { Landmark } from "./content";
import { museumTheme, type MuseumLayout } from "./museum-theme";
import { buildCompactGallery } from "./compact-gallery";

export type Exhibit = Landmark["exhibits"][number];
export type ExhibitKind = "project-model" | "blog-constellation" | "daily-signal" | "echo-fragment" | "audio-echo" | "signal";

export type ExhibitSlot = {
  id: string;
  index: number;
  position: [number, number, number];
  rotation: number;
  exhibit: Exhibit | null;
  kind: ExhibitKind;
  viewingPoint?: [number, number];
  footprint?: [number, number];
  site?: number;
  zoneId?: string;
};

export type HallConfig = {
  id: Landmark["id"];
  hallLabel: string;
  roomLabel: string;
  capacity: number;
  interactionLabel: string;
  emptyLabel: string;
};

export const hallConfigs: Record<string, HallConfig> = {
  workshop: {
    id: "workshop",
    hallLabel: "PROJECT PAVILION / 项目馆",
    roomLabel: "项目构型厅",
    capacity: 12,
    interactionLabel: "启动原型",
    emptyLabel: "等待下一件造物",
  },
  observatory: {
    id: "observatory",
    hallLabel: "WRITING PAVILION / 写作馆",
    roomLabel: "星图阅览厅",
    capacity: 12,
    interactionLabel: "校准星图",
    emptyLabel: "等待下一条思想坐标",
  },
  "memory-grove": {
    id: "memory-grove",
    hallLabel: "ECHO PAVILION / 回声馆",
    roomLabel: "回声林下",
    capacity: 12,
    interactionLabel: "唤醒回声",
    emptyLabel: "等待下一段回声",
  },
};

export type MuseumRoom = {
  layout: MuseumLayout;
  id: string;
  title: string;
  kind: ExhibitKind;
  centerZ: number;
  width: number;
  depth: number;
  startIndex: number;
  count: number;
  centerX?: number;
  arrival?: [number, number];
};
export type MuseumPlan = {
  rooms: MuseumRoom[];
  slots: ExhibitSlot[];
  entranceZ: number;
  backZ: number;
  length: number;
  shell?: { width: number; frontZ: number; backZ: number };
  placements?: Record<string, number>;
  furnishings?: { id: string; kind: 'reading-bench' | 'bay-screen'; position: [number, number]; size: [number, number]; height: number }[];
};

export const exhibitKindNames: Record<ExhibitKind, string> = {
  "project-model": "作品与原型", "blog-constellation": "长文与思想",
  "daily-signal": "今日赠语", "echo-fragment": "记忆片段",
  "audio-echo": "声音收藏", signal: "外部信号",
};

// Curatorial grouping followed by footprint-aware room packing. A room holds at
// most four objects; larger collections extend the spine instead of squeezing bays.
export function buildMuseumPlan(landmark: Landmark, placements?: Record<string, number>): MuseumPlan {
  if (landmark.id === 'workshop' || landmark.id === 'observatory') return buildCompactGallery(landmark, getExhibitKind, placements);
  const layout = museumTheme(landmark.id).layout;
  const groups = new Map<string, { kind: ExhibitKind; title: string; exhibits: Exhibit[] }>();
  for (const exhibit of landmark.exhibits) {
    const kind = getExhibitKind(landmark.id, exhibit);
    const title = exhibit.artifactSpec?.zone || exhibitKindNames[kind];
    const key = `${kind}:${title}`;
    const group = groups.get(key) ?? { kind, title, exhibits: [] };
    group.exhibits.push(exhibit);
    groups.set(key, group);
  }
  const rooms: MuseumRoom[] = [];
  const slots: ExhibitSlot[] = [];
  let frontZ = 7;
  // The reading hall opens with long-form work. A daily fragment gets its own
  // quieter room after the articles, regardless of API insertion order.
  const orderedGroups = [...groups].sort((a, b) => landmark.id === 'observatory'
    ? Number(b[1].kind === 'blog-constellation') - Number(a[1].kind === 'blog-constellation') : 0);
  for (const [groupKey, { kind, title, exhibits: unsorted }] of orderedGroups) {
    const exhibits = [...unsorted].sort((a, b) => Number(b.collection === 'featured' || Boolean(b.artifactSpec?.featured)) - Number(a.collection === 'featured' || Boolean(a.artifactSpec?.featured)));
    const reflective = /叙事|思想|札记|经验/.test(title);
    const capacity = reflective || kind === 'daily-signal' ? 2 : 4;
    for (let offset = 0; offset < exhibits.length; offset += capacity) {
      const contents = exhibits.slice(offset, offset + capacity);
      // Reading-heavy or physically intricate works get longer pause bays.
      const complexity = Math.max(...contents.map((item) =>
        Math.min(1, item.summary.length / 400 + (item.tags?.length ?? 0) / 24)));
      const rowPitch = (layout === "garden" ? 6.7 : layout === "archive" ? 6.2 : 5.8) + complexity * 1.4 + (reflective ? 1.4 : 0);
      const rows = Math.ceil(contents.length / 2);
      const depth = (layout === "garden" ? 7 : 6) + rows * rowPitch;
      const width = layout === "garden" ? 20 : reflective ? 21 : /系统|连接/.test(title) ? 20 : 19;
      const room: MuseumRoom = {
        id: `${landmark.id}:${groupKey}:${offset / capacity}`,
        title, kind, layout, centerZ: frontZ - depth / 2,
        width, depth, startIndex: slots.length, count: contents.length,
      };
      rooms.push(room);
      contents.forEach((exhibit, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        const row = Math.floor(index / 2);
        // Laboratory pairs, staggered reading bays, or loose garden clearings.
        const drift = layout === "garden" ? (index % 3 - 1) * .55 : 0;
        const x = layout === "archive" ? side * (row === 0 ? 4.5 : 5) : layout === "garden" ? side * (5.5 + row * .35) : side * 4.7;
        const z = frontZ - 4.2 - row * rowPitch - (layout === "archive" && side > 0 ? 1.25 : 0) + drift;
        slots.push({
          id: exhibit.id, index: slots.length, kind, exhibit,
          position: [x, 0, z],
          rotation: (side < 0 ? Math.PI / 2 : -Math.PI / 2) + (layout === "archive" ? side * .18 : layout === "garden" ? drift * .5 : 0),
        });
      });
      frontZ -= depth + 3.6;
    }
  }
  if (!rooms.length) rooms.push({
    id: `${landmark.id}:foyer`, title: "等待下一次展出",
    kind: getExhibitKind(landmark.id), layout, centerZ: 0, width: 19, depth: 14, startIndex: 0, count: 0,
  });
  const backZ = rooms.at(-1)!.centerZ - rooms.at(-1)!.depth / 2;
  return { rooms, slots, entranceZ: 6, backZ, length: 7 - backZ };
}

export function museumWalkLimit(plan: MuseumPlan, z: number) {
  if (plan.shell) return plan.shell.width / 2 - .55;
  const room = plan.rooms.find((item) => z <= item.centerZ + item.depth / 2 - .75 && z >= item.centerZ - item.depth / 2 + .75);
  return room ? room.width / 2 - 1 : 2.35;
}

export function constrainMuseumPosition(plan: MuseumPlan, x: number, z: number, previous?: readonly [number, number]): [number, number] {
  let safeZ = Math.max(plan.backZ + 1, Math.min(plan.shell ? plan.shell.frontZ - .55 : 6.8, z));
  // Meet a partition in place instead of snapping sideways into its doorway.
  if (previous && Math.abs(previous[0]) > museumWalkLimit(plan, safeZ) && museumWalkLimit(plan, safeZ) < museumWalkLimit(plan, previous[1])) safeZ = previous[1];
  const limit = museumWalkLimit(plan, safeZ);
  let safeX = Math.max(-limit, Math.min(limit, x));
  let resultZ = safeZ;
  const obstacles = [
    ...plan.slots.map(slot => ({ x: slot.position[0], z: slot.position[2], size: slot.footprint || [2.2, 2.7] })),
    ...(plan.furnishings || []).map(item => ({ x: item.position[0], z: item.position[1], size: item.size })),
  ];
  for (const obstacle of obstacles) {
    const dx = safeX - obstacle.x;
    const dz = resultZ - obstacle.z;
    // The footprint includes the display and a traveler-radius buffer.
    const halfX = obstacle.size[0] / 2 + .35;
    const halfZ = obstacle.size[1] / 2 + .35;
    if (Math.abs(dx) < halfX && Math.abs(dz) < halfZ) {
      const faces: [number, number][] = [
        [obstacle.x - halfX, resultZ], [obstacle.x + halfX, resultZ],
        [safeX, obstacle.z - halfZ], [safeX, obstacle.z + halfZ],
      ];
      const valid = faces.filter(([faceX, faceZ]) => Math.abs(faceX) <= museumWalkLimit(plan, faceZ) && faceZ >= plan.backZ + 1 && faceZ <= (plan.shell ? plan.shell.frontZ - .55 : 6.8));
      // Stay on the entry side of the furniture. Choosing only the nearest
      // face can push a traveler through a thin screen or beyond an outer wall.
      const entryFaces = previous ? valid.filter(([faceX, faceZ]) =>
        (previous[0] <= obstacle.x - halfX && faceX === obstacle.x - halfX) ||
        (previous[0] >= obstacle.x + halfX && faceX === obstacle.x + halfX) ||
        (previous[1] <= obstacle.z - halfZ && faceZ === obstacle.z - halfZ) ||
        (previous[1] >= obstacle.z + halfZ && faceZ === obstacle.z + halfZ)) : [];
      const options = entryFaces.length ? entryFaces : valid;
      options.sort((a, b) => Math.hypot(a[0] - safeX, a[1] - resultZ) - Math.hypot(b[0] - safeX, b[1] - resultZ));
      if (options[0]) [safeX, resultZ] = options[0];
    }
  }
  return [safeX, resultZ];
}

export function selectNearbyExhibit(slots: ExhibitSlot[], x: number, z: number, currentId: string | null, direction?: readonly [number, number]): ExhibitSlot | null {
  // A standing visitor can read a nearby object; while moving, prefer the
  // object ahead. Reject an object hidden behind another display's footprint.
  const eligible = (slot: ExhibitSlot) => {
    const dx = slot.position[0] - x, dz = slot.position[2] - z, distance = Math.hypot(dx, dz);
    if (direction && distance && (dx * direction[0] + dz * direction[1]) / distance < -.15) return false;
    return !slots.some(other => {
      if (other === slot || !other.exhibit) return false;
      const t = ((other.position[0] - x) * dx + (other.position[2] - z) * dz) / (distance * distance);
      return t > .05 && t < .9 && Math.hypot(x + dx * t - other.position[0], z + dz * t - other.position[2]) < 1.2;
    });
  };
  const current = slots.find((slot) => slot.id === currentId && slot.exhibit);
  // A release radius prevents two adjacent labels flickering at the boundary.
  if (current && eligible(current) && Math.hypot(current.position[0] - x, current.position[2] - z) < 3.4) return current;
  let closest: ExhibitSlot | null = null;
  let distance = 3.1;
  for (const slot of slots) {
    if (!slot.exhibit || !eligible(slot)) continue;
    const next = Math.hypot(slot.position[0] - x, slot.position[2] - z);
    if (next < distance) { closest = slot; distance = next; }
  }
  return closest;
}

export function getHallConfig(landmarkId: string): HallConfig {
  return hallConfigs[landmarkId] ?? hallConfigs.workshop;
}

export function getExhibitKind(landmarkId: string, exhibit?: Exhibit | null): ExhibitKind {
  if (exhibit?.presentation) return exhibit.presentation;
  if (exhibit?.sourceType === "project") return "project-model";
  if (exhibit?.sourceType === "blog") return "blog-constellation";
  if (exhibit?.sourceType === "guestbook") return "echo-fragment";
  if (exhibit?.id.startsWith("daily-capsule:")) return "daily-signal";
  if (exhibit?.id.startsWith("now-playing:")) return "audio-echo";
  if (exhibit?.sourceType === "external") return "signal";
  if (landmarkId === "workshop") return "project-model";
  if (landmarkId === "observatory") return "blog-constellation";
  if (landmarkId === "memory-grove") return "echo-fragment";
  return "signal";
}

export function buildExhibitSlots(landmark: Landmark): ExhibitSlot[] {
  return buildMuseumPlan(landmark).slots;
}

export function getExhibitAction(kind: ExhibitKind) {
  if (kind === "project-model") return { prompt: "启动构型", destination: "查看项目详情" };
  if (kind === "blog-constellation") return { prompt: "展开星座", destination: "在 GWorkspace 阅读全文" };
  if (kind === "daily-signal") return { prompt: "读取今日光页", destination: "查看今日赠语" };
  if (kind === "echo-fragment") return { prompt: "倾听片段", destination: "查看回声来源" };
  if (kind === "audio-echo") return { prompt: "重放声音", destination: "打开声音来源" };
  return { prompt: "接收信号", destination: "打开来源" };
}
