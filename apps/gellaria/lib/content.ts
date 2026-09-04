import { z } from "zod";

export const landmarkExhibitSchema = z.object({
  id: z.string(),
  label: z.string(),
  title: z.string(),
  summary: z.string(),
  sourceType: z.enum(["project", "blog", "guestbook", "external"]).optional(),
  href: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  publishedAt: z.string().nullable().optional(),
});

export const landmarkSchema = z.object({
  id: z.string(),
  name: z.string(),
  kicker: z.string(),
  description: z.string(),
  detail: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  accent: z.string(),
  actionLabel: z.string(),
  artifact: z.string(),
  tagOptions: z.tuple([z.string(), z.string(), z.string()]),
  collectionLabel: z.string(),
  exhibits: z.array(landmarkExhibitSchema).max(8),
  influenceColors: z.tuple([z.string(), z.string(), z.string()]),
  influenceDescription: z.string(),
});

export type Landmark = z.infer<typeof landmarkSchema>;

export const landmarks: Landmark[] = z.array(landmarkSchema).parse([
  {
    id: "workshop",
    name: "造物工坊",
    kicker: "Projects / 正在建造",
    description: "这里保存已经成形的作品，也保留仍在试错的结构。",
    detail:
      "Gellaria 是目前最重要的一项建造：它把个人网站从目录变成可被共同经历的地点。访客的路径、停留和信标，会逐渐改变工坊外的光线。",
    position: [11, 0, 3],
    accent: "#ef8d63",
    actionLabel: "留下火种",
    artifact: "一枚仍有余温的铜制齿轮",
    tagOptions: ["仍在生长", "想亲手试试", "值得再来"],
    collectionLabel: "BUILD REGISTER / 建造记录",
    exhibits: [
      {
        id: "gellaria",
        label: "正在建造",
        title: "Gellaria",
        summary: "把个人网站从内容目录变成一座能被共同经历、持续留下痕迹的多人 3D 世界。",
      },
      {
        id: "place-not-index",
        label: "建造方法",
        title: "把目录变成地点",
        summary: "作品不只等待点击；它们成为可抵达的设施，并由路径、停留和信标获得新的状态。",
      },
    ],
    influenceColors: ["#ef8d63", "#e8c87d", "#d49a72"],
    influenceDescription: "光迹会抬高炉温与齿轮转速，主导标签决定工坊回应的火色。",
  },
  {
    id: "observatory",
    name: "思想观测站",
    kicker: "Notes / 思考与记录",
    description: "没有结论的念头先在这里成为星体，再慢慢形成星座。",
    detail:
      "我关心人与工具如何共同改变表达。技术不是陈列柜，而是一种组织经验的材料。每一篇长期写作，都会在穹顶上留下一个可再次定位的坐标。",
    position: [-3, 0, -12],
    accent: "#9ec5e8",
    actionLabel: "校准星图",
    artifact: "一张标有未知坐标的薄片",
    tagOptions: ["产生共鸣", "尚未命名", "改变视角"],
    collectionLabel: "FIELD NOTES / 观测札记",
    exhibits: [
      {
        id: "people-and-tools",
        label: "长期命题",
        title: "人与工具如何共同改变表达",
        summary: "技术不是陈列柜，而是一种组织经验、改变表达边界的材料。",
      },
      {
        id: "constellation-method",
        label: "记录方法",
        title: "先成为星体，再形成星座",
        summary: "没有结论的念头先被保存；长期写作再让分散坐标逐渐显出关系。",
      },
    ],
    influenceColors: ["#9ec5e8", "#c5b9dc", "#91d0c6"],
    influenceDescription: "光迹会扩大望远镜的巡弋范围，主导标签决定穹顶正在校准的光谱。",
  },
  {
    id: "memory-grove",
    name: "回声林地",
    kicker: "Archive / 记忆与偏爱",
    description: "声音、图像和不适合写进履历的片段，在林间以回声保存。",
    detail:
      "这是更私人的档案区：读过的句子、反复听的声音、一些阶段性的审美和记忆。内容不会一次全部出现，它依赖季节，也依赖来访者曾经走过哪里。",
    position: [-12, 0, 4],
    accent: "#9fbd73",
    actionLabel: "唤醒回声",
    artifact: "一颗记录着微弱声音的种子",
    tagOptions: ["似曾相识", "愿意停留", "想起一件事"],
    collectionLabel: "ECHO INDEX / 回声索引",
    exhibits: [
      {
        id: "unlisted-fragments",
        label: "收藏方法",
        title: "不适合写进履历的片段",
        summary: "声音、图像、读过的句子与阶段性的偏爱，在这里以回声而不是成就被保存。",
      },
      {
        id: "seasonal-archive",
        label: "开放方式",
        title: "依赖季节的私人档案",
        summary: "内容不会一次全部出现；访客走过的路径和世界所处的阶段共同决定显影顺序。",
      },
    ],
    influenceColors: ["#9fbd73", "#e2c98b", "#afc9dc"],
    influenceDescription: "光迹会唤醒更多记忆灯，主导标签决定水池与回声的颜色。",
  },
]);

export const role = {
  id: "cartographer",
  name: "制图师",
  description: "靠近地标并留下信标。你的光迹会成为后来者的方向。",
};

export const studyArea = {
  id: "night-study",
  name: "夜航自习室",
  kicker: "FOCUS ROOM / 临时停泊",
  position: [7.5, 0, 10.5] as [number, number, number],
  interactionRadius: 6.2,
  interactionReleaseRadius: 6.8,
  exitPosition: [-0.6, 0.7, 6.8] as [number, number, number],
  accent: "#e8c87d",
};
