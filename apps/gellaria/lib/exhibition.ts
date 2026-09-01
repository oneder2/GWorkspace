import type { Landmark } from "./content";

export type Exhibit = Landmark["exhibits"][number];
export type ExhibitKind = "prototype" | "constellation" | "echo" | "signal";

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
    roomLabel: "原型陈列厅",
    capacity: 8,
    interactionLabel: "启动原型",
    emptyLabel: "等待下一件造物",
  },
  observatory: {
    id: "observatory",
    hallLabel: "WRITING PAVILION / 写作馆",
    roomLabel: "星图阅览厅",
    capacity: 8,
    interactionLabel: "校准星图",
    emptyLabel: "等待下一条思想坐标",
  },
  "memory-grove": {
    id: "memory-grove",
    hallLabel: "ECHO PAVILION / 回声馆",
    roomLabel: "回声温室",
    capacity: 8,
    interactionLabel: "唤醒回声",
    emptyLabel: "等待下一段回声",
  },
};

const slotPositions: Array<{ position: [number, number, number]; rotation: number }> = [
  { position: [-1.7, 0, 1.65], rotation: Math.PI - 0.06 },
  { position: [1.7, 0, 1.65], rotation: Math.PI + 0.06 },
  { position: [-5.1, 0, 1.25], rotation: Math.PI - 0.18 },
  { position: [5.1, 0, 1.25], rotation: Math.PI + 0.18 },
  { position: [-5.1, 0, -3.25], rotation: 0.18 },
  { position: [-1.7, 0, -3.65], rotation: 0.06 },
  { position: [1.7, 0, -3.65], rotation: -0.06 },
  { position: [5.1, 0, -3.25], rotation: -0.18 },
];

export function getHallConfig(landmarkId: string): HallConfig {
  return hallConfigs[landmarkId] ?? hallConfigs.workshop;
}

export function getExhibitKind(landmarkId: string, exhibit?: Exhibit | null): ExhibitKind {
  if (exhibit?.sourceType === "project") return "prototype";
  if (exhibit?.sourceType === "blog") return "constellation";
  if (exhibit?.sourceType === "guestbook") return "echo";
  if (exhibit?.sourceType === "external") return "signal";
  if (landmarkId === "workshop") return "prototype";
  if (landmarkId === "observatory") return "constellation";
  if (landmarkId === "memory-grove") return "echo";
  return "signal";
}

export function buildExhibitSlots(landmark: Landmark): ExhibitSlot[] {
  const config = getHallConfig(landmark.id);
  return slotPositions.slice(0, config.capacity).map((layout, index) => {
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
  if (kind === "prototype") return { prompt: "启动原型", destination: "在 GWorkspace 查看项目" };
  if (kind === "constellation") return { prompt: "校准星图", destination: "在 GWorkspace 阅读全文" };
  if (kind === "echo") return { prompt: "唤醒回声", destination: "查看回声来源" };
  return { prompt: "接收信号", destination: "打开来源" };
}
