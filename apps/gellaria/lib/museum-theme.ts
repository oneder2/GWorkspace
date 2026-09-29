export type MuseumLayout = "fabrication" | "archive" | "garden";

export const museumThemes = {
  workshop: {
    layout: "fabrication" as MuseumLayout, name: "原型实验室", route: "沿铜色轨道参观原型工作台",
    background: "#10222e", floor: "#263944", wall: "#47616a", dark: "#122630",
    accent: "#edaa63", light: "#bce1dc", paper: "#d9ded2", ink: "#193340",
  },
  observatory: {
    layout: "archive" as MuseumLayout, name: "藏书与思想", route: "沿靛蓝书廊阅读，靠近书案展开篇章",
    background: "#272333", floor: "#5a4548", wall: "#ad9177", dark: "#353a62",
    accent: "#d6b778", light: "#ffe3b5", paper: "#f0dbc0", ink: "#493541",
  },
  "memory-grove": {
    layout: "garden" as MuseumLayout, name: "林下记忆庭", route: "沿石径漫步，靠近叶片拾起一段回声",
    background: "#102c32", floor: "#193f3c", wall: "#48746c", dark: "#493f54",
    accent: "#b5a5de", light: "#b8e1d3", paper: "#d3e0d8", ink: "#264a49",
  },
};
export type MuseumTheme = typeof museumThemes[keyof typeof museumThemes];
export function museumTheme(id: string): MuseumTheme {
  return museumThemes[id as keyof typeof museumThemes] ?? museumThemes.workshop;
}
