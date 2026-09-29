export type MuseumLayout = "fabrication" | "archive" | "garden";

export const museumThemes = {
  workshop: {
    layout: "fabrication" as MuseumLayout, name: "原型实验室", route: "从一件作品开始：了解用途、我的参与，再打开真实项目。",
    background: "#b7c9ce", panel: "#193340", floor: "#b1c1c4", wall: "#cbd6d4", dark: "#597680",
    accent: "#edaa63", light: "#bce1dc", paper: "#d9ded2", ink: "#193340",
  },
  observatory: {
    layout: "archive" as MuseumLayout, name: "藏书与思想", route: "长文展开为独立篇章；今日赠语单独停留。选一篇，回到原文阅读。",
    background: "#c9c7cf", panel: "#302d43", floor: "#c4b9ae", wall: "#ddd3c2", dark: "#727b96",
    accent: "#d6b778", light: "#ffe3b5", paper: "#f0dbc0", ink: "#493541",
  },
  "memory-grove": {
    layout: "garden" as MuseumLayout, name: "林下记忆庭", route: "沿石径漫步，靠近叶片拾起一段回声",
    background: "#102c32", panel: "#102c32", floor: "#193f3c", wall: "#48746c", dark: "#493f54",
    accent: "#b5a5de", light: "#b8e1d3", paper: "#d3e0d8", ink: "#264a49",
  },
};
export type MuseumTheme = typeof museumThemes[keyof typeof museumThemes];
export function museumTheme(id: string): MuseumTheme {
  return museumThemes[id as keyof typeof museumThemes] ?? museumThemes.workshop;
}
