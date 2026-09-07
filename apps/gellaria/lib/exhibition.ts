import type { Landmark } from "./content";

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

type SlotLayout = Array<{ position: [number, number, number]; rotation: number }>;

const workshopSlots: SlotLayout = [5, 3, 1, -1, -3, -5].flatMap((z) => [
  { position: [-5.35, 0, z] as [number, number, number], rotation: Math.PI / 2 },
  { position: [5.35, 0, z] as [number, number, number], rotation: -Math.PI / 2 },
]);

const observatorySlots: SlotLayout = [5, 3, 1, -1, -3, -5].flatMap((z) => [
  { position: [-5.05, 0, z] as [number, number, number], rotation: Math.PI / 2 },
  { position: [5.05, 0, z] as [number, number, number], rotation: -Math.PI / 2 },
]);

const groveSlots: SlotLayout = [
  { position: [-4.4, 0, 4.35], rotation: 1.34 },
  { position: [3.85, 0, 3.6], rotation: -1.18 },
  { position: [-3.2, 0, 1.55], rotation: 1.08 },
  { position: [4.65, 0, 0.7], rotation: -1.42 },
  { position: [-4.75, 0, -1.1], rotation: 1.48 },
  { position: [3.25, 0, -2.05], rotation: -1.12 },
  { position: [-3.65, 0, -4.35], rotation: 1.22 },
  { position: [4.4, 0, -4.85], rotation: -1.36 },
  { position: [-2.55, 0, 3.2], rotation: 0.74 },
  { position: [2.2, 0, 2.1], rotation: -0.66 },
  { position: [-2.4, 0, -2.8], rotation: 0.62 },
  { position: [2.7, 0, -4.05], rotation: -0.78 },
];

const hallSlotLayouts: Record<string, SlotLayout> = {
  workshop: workshopSlots,
  observatory: observatorySlots,
  "memory-grove": groveSlots,
};

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
  const config = getHallConfig(landmark.id);
  const layouts = hallSlotLayouts[landmark.id] ?? workshopSlots;
  const activeCapacity = Math.min(config.capacity, Math.max(8, Math.ceil(landmark.exhibits.length / 2) * 2));
  const activeLayouts = landmark.id === "memory-grove"
    ? layouts.slice(0, landmark.exhibits.length)
    : layouts.slice(0, activeCapacity);
  return activeLayouts.map((layout, index) => {
    const exhibit = landmark.exhibits[index] ?? null;
    return {
      id: exhibit?.id ?? `${landmark.id}:reserved:${index + 1}`,
      index,
      ...layout,
      exhibit,
      kind: getExhibitKind(landmark.id, exhibit),
    };
  });
}

export function getExhibitAction(kind: ExhibitKind) {
  if (kind === "project-model") return { prompt: "启动构型", destination: "在 GWorkspace 查看项目" };
  if (kind === "blog-constellation") return { prompt: "展开星座", destination: "在 GWorkspace 阅读全文" };
  if (kind === "daily-signal") return { prompt: "读取今日光页", destination: "查看今日赠语" };
  if (kind === "echo-fragment") return { prompt: "倾听片段", destination: "查看回声来源" };
  if (kind === "audio-echo") return { prompt: "重放声音", destination: "打开声音来源" };
  return { prompt: "接收信号", destination: "打开来源" };
}
