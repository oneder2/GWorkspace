import type { Landmark } from "./content";
import { museumTheme, type MuseumLayout } from "./museum-theme";

export type Exhibit = Landmark["exhibits"][number];
export type ExhibitKind = "project-model" | "blog-constellation" | "daily-signal" | "echo-fragment" | "audio-echo" | "signal";

export type ExhibitSlot = {
  id: string;
  index: number;
  position: [number, number, number];
  rotation: number;
  exhibit: Exhibit | null;
  kind: ExhibitKind;
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
};
export type MuseumPlan = {
  rooms: MuseumRoom[];
  slots: ExhibitSlot[];
  entranceZ: number;
  backZ: number;
  length: number;
};

export const exhibitKindNames: Record<ExhibitKind, string> = {
  "project-model": "作品与原型", "blog-constellation": "长文与思想",
  "daily-signal": "今日赠语", "echo-fragment": "记忆片段",
  "audio-echo": "声音收藏", signal: "外部信号",
};

// Curatorial grouping followed by footprint-aware room packing. A room holds at
// most four objects; larger collections extend the spine instead of squeezing bays.
export function buildMuseumPlan(landmark: Landmark): MuseumPlan {
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
  for (const [groupKey, { kind, title, exhibits: unsorted }] of groups) {
    const exhibits = [...unsorted].sort((a, b) => Number(Boolean(b.artifactSpec?.featured)) - Number(Boolean(a.artifactSpec?.featured)));
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
        const x = layout === "archive" ? side * (row === 0 ? 5.5 : 6.1) : layout === "garden" ? side * (5.5 + row * .35) : side * 6.1;
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
  const room = plan.rooms.find((item) => z <= item.centerZ + item.depth / 2 - .75 && z >= item.centerZ - item.depth / 2 + .75);
  return room ? room.width / 2 - 1 : 2.35;
}

export function constrainMuseumPosition(plan: MuseumPlan, x: number, z: number, previous?: readonly [number, number]): [number, number] {
  let safeZ = Math.max(plan.backZ + 1, Math.min(6.8, z));
  // Meet a partition in place instead of snapping sideways into its doorway.
  if (previous && Math.abs(previous[0]) > museumWalkLimit(plan, safeZ) && museumWalkLimit(plan, safeZ) < museumWalkLimit(plan, previous[1])) safeZ = previous[1];
  const limit = museumWalkLimit(plan, safeZ);
  let safeX = Math.max(-limit, Math.min(limit, x));
  let resultZ = safeZ;
  for (const slot of plan.slots) {
    const dx = safeX - slot.position[0];
    const dz = resultZ - slot.position[2];
    // The footprint includes the display and a traveler-radius buffer.
    const halfX = 1.45;
    const halfZ = 1.7;
    if (Math.abs(dx) < halfX && Math.abs(dz) < halfZ) {
      if (halfX - Math.abs(dx) < halfZ - Math.abs(dz)) safeX = slot.position[0] + (dx < 0 ? -halfX : halfX);
      else resultZ = slot.position[2] + (dz < 0 ? -halfZ : halfZ);
    }
  }
  return [safeX, resultZ];
}

export function selectNearbyExhibit(slots: ExhibitSlot[], x: number, z: number, currentId: string | null): ExhibitSlot | null {
  const current = slots.find((slot) => slot.id === currentId && slot.exhibit);
  // A release radius prevents two adjacent labels flickering at the boundary.
  if (current && Math.hypot(current.position[0] - x, current.position[2] - z) < 3.6) return current;
  let closest: ExhibitSlot | null = null;
  let distance = 3.1;
  for (const slot of slots) {
    if (!slot.exhibit) continue;
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
