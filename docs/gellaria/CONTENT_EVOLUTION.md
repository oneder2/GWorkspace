# 林地与内容驱动展品：2026-09-27

后续的近看、后台策展、阅读去重、全目录和循环林地见 [展览体验改进](EXHIBITION_EXPERIENCE.md)。本文记录本轮之前的阶段状态，其中十二件展览限制已由后续全目录补充。

本次在已有 GWorkspace 内容权威源及 Gellaria 展馆上增量实现，不改变博客、简历的发布规则。没有提交、推送或部署。

## 调研与设计依据

实际读取的资料与采用方式：

- [The Algorithmic Beauty of Plants，第 1 章](https://algorithmicbotany.org/papers/abop/abop-ch1.pdf)：递归重写与 turtle geometry。采用有限深度二叉分枝、逐级变细与黄金角叶簇排列；不是完整的植物生长模拟。
- [Bridson, Fast Poisson Disk Sampling in Arbitrary Dimensions](https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf)：采用 `r/√2` 空间网格、`[r,2r]` 圆环中按面积均匀采样、30 次候选与活动列表。生成后排除中央阅读净空和行走边界，避免规则两排树及树干碰撞。
- [MathWorld：Lissajous Curve](https://mathworld.wolfram.com/LissajousCurve.html)：以整数频率闭合的谐振曲线，扩展一个深度谐波构成三维雕塑。
- [MathWorld：Superellipse / Gielis superformula](https://mathworld.wolfram.com/Superellipse.html)：采用有界的极坐标超公式，增加纵向谐波；不将该公式声称为真实植物的生物学规律。
- [Three.js：TorusKnotGeometry](https://threejs.org/docs/pages/TorusKnotGeometry.html)：互素 `p/q` 决定环绕结构。此处使用同类参数曲线经 Catmull–Rom 与 TubeGeometry 构造，以便统一路径上的运动。
- [Three.js：InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html)：研究减少 draw calls 的方法；实现选择按树合并静态树枝和叶片几何，保持每棵树的视线淡出能力，地被合并为一个网格。

视觉方向沿用林地已有的夜色 `#071f26`、苔绿 `#295549`、叶绿 `#497c67`、浅色文字 `#d1e8ce`、回声紫 `#bdafdd` 与树皮暖色 `#ac9169`。回声用衬线字，导航沿用现有无衬线界面，辅助标记沿用等宽样式。

构图是“低位路径—中层文字净空—高位枝叶”，保留森林里的文字而不增加展柜。比较过密林包围与中央净空两种方式；选择后者，避免更复杂的建模遮住回声。树干增加弯曲、连续收细与树皮色纹，树冠使用独立叶片；林下增加蕨类、根系、苔石、菌菇和低位微光。远处雾化，文字保持亮度。

视觉复查后增加按距离保持的最小字形尺寸、加粗字形和屏幕投影避让，避免文字太小或互相叠压。桌面最多四段、手机最多两段同时进入阅读视野；具体数目由投影冲突决定。仍保留逐字显现、回声拖尾、淡出、暂停、完整阅读弹窗和减少动态效果模式。

## 每个现有项目的独立设计

依据本地数据库中的中英简介、技术栈、参与信息和项目亮点逐项分析；没有把网络猜测写入事实数据。现有 11 个项目均包含 `resume_web` 或 `resume_pdf`，因此均采用认真设计的具象模型，其中 9 个带 `gellaria` 展示范围。

| 项目 | 持久化意象 / 结构 | 当前在 Gellaria 展出 |
| --- | --- | --- |
| GWorkspace | 内容权威中枢：档案核、写作台、发布轨道 | 是 |
| CiteAI | 论断与证据校验台：论断纸叠、检索透镜、证据节点、引用输出 | 是 |
| Vana | 离线文档库：本地抽屉、同步拱环、多格式导出页 | 是 |
| SurfSmart | 网站研究潜望镜：潜望筒、环绕网页窗口、采样轨道 | 是 |
| Twilight Zone | 暮色解谜舞台：侧视地台、错层门框、同伴灯火 | 是 |
| 结构化个人简历网站 | 双语排字台：共同书脊、两侧版面、输出端 | 是 |
| Farivy | 渐进训练仪：杠铃、配重片、逐级训练曲线 | 是 |
| 潮汐计划 | 潮汐日程仪：多跨度时间盘、指针、任务签 | 是 |
| Oceannect | 双人记忆桥：伴侣节点、共享时间线、记忆珠 | 是 |
| 作品集站点 | 作品视窗：不同画幅、索引与展页 | 否，保留现有 surfaces |
| Moblify | 模拟影片机：模拟轨道、竖屏画框、胶轮 | 否，保留现有 surfaces |

非简历项目使用 `kinetic` 配方。根据连接/生态等内容选择环面纽结、超公式曲线或三维李萨如曲线，技术栈数量和正文结构影响频率与瓣数，稳定的记录种子决定相位。双层曲线、沿轨运动光点与缓慢姿态变化构成动态雕塑；减少动态效果时停止运动。

## 每篇现有文章

已逐篇读取正文，包括不能被当成完整论述的测试文章。以下阅读量是迁移时本地快照，不声称是线上实时统计。

| 文章 | 阅读量 / 阶段 | 内容对应模型 |
| --- | --- | --- |
| Frontend Trends 2025 | 5 / 1 | 前端技术地平线：构建、服务端、边缘计算节点 |
| The Zen of Vue Composition API | 10 / 2 | 逻辑复用树：共享主干与组件分枝 |
| Reimagining the Personal Web test | 23 / 2 | 透明层叠窗：玻璃层次与上下文 |
| 测试（`test`，水果表格） | 58 / 3 | 信息编织架：分类列、记录行与索引结 |
| 测试（`测试`，Python 代码） | 13 / 2 | 代码执行棱镜：输入、执行、输出 |
| 图片测试 | 40 / 2 | 影像光圈：画幅、光圈与影像层；不臆测图片语义 |
| 长文章测试：我的人类简史 | 55 / 3 | 文明地层：时间层、因果桥与上升节点，表现进步代价的追问 |

一条未发布空白草稿不对外建模。25 条有效每日赠语继续用兼容的光页模型。

## 自动建模与升级

`Project.create/update`、`Blog.create/update` 和简历导入都会同步内容配方。应用启动和一次性回填也覆盖已有公开记录。新内容采用主题规则与文档结构分析；已知作品有单独设计，不把标题哈希当成内容理解。无匹配主题时使用正文段落与小节组成叙事悬页，并明确记录 `document-structure` 依据。

这是无需外部密钥的确定性程序化建模，不是运行远端 AI agent、在线搜索或生成 GLB 文件。首次读取新的陌生主题时，规则系统的理解深度有边界；可以扩展 `artifactDesign.js` 的主题解释和对应几何，而无需修改发布内容。网络搜索仅用于本轮算法调研，不在每次阅读请求内执行。

文章升级门槛为 **1、10、50、200、2,000、20,000、200,000……**。“200 之后每个量级”按十倍解释。

- 0 次：保存绑定和内容分析，展品先呈现合上的书；首次阅读才展开独立主题模型。
- 跨门槛：在后端 `Blog.incrementViews()` 中同步升级；只递增阅读量的普通请求不写模型、不增版本。
- 一次跨多个门槛：直接生成目标阶段并记录一次事件；避免无意义的中间几何构建。
- 阅读量修正下降：保留已经获得的模型细节；内容编辑仍然重新解释。
- 更高阶段增加曲线分段、细部节点、雕饰环以及相关模型结构，保持主体意象和 artifact ID 不变。
- 在 JavaScript 安全整数支持的全部 17 个门槛内都有新增几何细节。上限为 224 个曲线分段、56 个饰点，防止无限增长拖垮客户端。
- 阅读量增加与模型/事件写入在同一 SQLite 事务内；失败整体回滚。
- 保留原 `POST /api/blogs/:id/views` 响应 `{ views }`。公开 GET 不写模型。
- 公共 world 的 `updatedAt` 包含模型更新时间。原 30 秒公开缓存 / 60 秒 Gellaria 数据缓存仍生效；已打开的展馆不会因其他读者阅读而突然更换模型，重新进入并经过缓存更新后可看到新模型。

展览仍遵守现有每馆 12 个条目的选择上限；后台绑定与升级覆盖所有已发布项目、文章，未入选当期展览的记录同样拥有模型。没有借此更改展览排序和展示范围。

## 数据与兼容契约

原 `gellaria_artifacts` 表以独占外键 `project_id` / `blog_id` / `capsule_id` / `placement_id` 绑定记录，保留 `source_hash`、`revision`、`generator` 和 `spec`。改名不改变模型身份；删除记录级联删除模型。

保留原 `artifactSpec.version = 2`，增加可选 `artifactSpec.design`：

```json
{
  "motif": "composition-tree",
  "name": "逻辑复用树",
  "rationale": "共享主干向组件分枝，接合点代表从 Options API 逐步抽取逻辑。",
  "parts": ["共享主干", "组件枝", "接合点"],
  "basis": "content-rules",
  "tier": "reading",
  "level": 2,
  "threshold": 10,
  "nextThreshold": 50,
  "subject": "The Zen of Vue Composition API",
  "synopsis": "Moving away from Options API was difficult at first...",
  "anchors": ["The Zen of Vue Composition API", "Vue", "JavaScript", "Coding"],
  "structure": { "headings": ["The Zen of Vue Composition API"], "paragraphs": 4, "images": 0, "codeBlocks": 0 },
  "geometry": { "family": "lissajous", "p": 2, "q": 5, "lobes": 4, "phase": 4.906 },
  "segments": 52,
  "ornaments": 8
}
```

客户端使用受限枚举及数值范围校验，不执行数据库传来的代码。旧 v2 配方以及更早的项目模型仍可显示。

新增迁移 `022_artifact_evolution.sql` 的 `gellaria_artifact_events` 表保存 `artifact_id`、唯一 `revision`、`reason`、`reading_level`、`views_at_build`、`source_hash`、完整 `spec` 和时间。原因有 created / content / tier / reading-milestone / generator。历史从本次迁移开始记录，不伪造此前快照。

本地迁移前备份：`/tmp/gworkspace-evolution-PUmo9D/before.db`。回填 43 条：11 项目 + 7 文章 + 25 每日赠语。预览数据库为同目录 `preview.db`。线上数据库未操作。

执行回填：

```bash
bash scripts/run-with-backend-node.sh node backend/scripts/backfill-gellaria-artifacts.js
```

脚本输出每条记录的绑定 ID、版本、具体设计、tier 和 level；重复执行不产生新版本或事件。

## 验证

- 后端：绑定、发布过滤、简历分级切换、内容更新、稳定身份、各阅读门槛、普通阅读不重建、计数下降不降级、事务失败回滚、并发阅读只升级一次、事件快照、幂等回填、只读公开 API、删除级联。
- 前端：最小间距与稳定采样、树干避碰、递归几何预算、文字净空、三类曲线闭合/有限/不越界、阅读细节预算，及原有世界兼容测试。
- 保留并运行 public world 与 resume/import 兼容性检查。
- 18 个前端测试文件、63 个测试全部通过；后端 artifacts 检查通过（含 12 个并发 HTTP 阅读请求跨门槛只升级一次）。
- public world 与 resume/import 兼容性检查通过；lint、TypeScript 和最终生产构建通过；`git diff --check` 通过。
- 本地再次回填：43 条绑定，事件数仍为 43，外键错误为 0。11 个项目分别有 11 个设计，7 篇文章分别有 7 个设计。
- 浏览器验证桌面、390×844 手机、减少动态效果、完整展签；最终林地页面无控制台错误。存在已有的 `THREE.Clock` 弃用警告。预览服务重启时曾产生一次 WebSocket 断线，重载恢复。
- 对实际公开 API 的 17 个展品配方执行前端 Schema 校验全部通过；在预览副本临时切换一个项目的简历 surfaces，验证 `kinetic` 分支，不修改正式项目的展示范围。
- 截图：`output/playwright/forest-verified-desktop.png`、`forest-verified-mobile.png`、`content-workshop.png`、`content-model-dossier.png`、`content-kinetic-preview.png`。浏览器检查采用生产构建和独立数据库副本。数学雕塑浏览器检查通过，预览副本的临时 surfaces 修改已恢复；本轮临时预览服务已停止。
