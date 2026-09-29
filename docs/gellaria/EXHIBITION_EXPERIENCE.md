# 展品近看、策展与循环林地

2026-09-28。本轮延续 GWorkspace 为内容权威源、Gellaria 为补充展示端的定位。旧版项目建模记录继续保留。本轮没有提交、推送或部署。

## 六项改动与入口

1. **驻足近看**：走近展品后按 E，镜头在原展室内降低并靠近模型。可以拖动旋转、滚轮或双指缩放，也可展开「视角控制」使用可由键盘操作的按钮。支持重置视角、阅读展签、Esc 返回漫步。角色在观察期间停止移动；建筑遮挡以当前展品为目标淡出，展品主体保持可见。
2. **三件作品演示**：CiteAI 的论断纸叠、证据透镜与引用输出；Vana 的本地抽屉、同步环与导出页；Oceannect 的伴侣节点、记忆传递与共同经历画框。按钮推进的是当前展品的场景构件，其他展品不受影响。这是项目功能的示意演示，不调用这些产品的真实服务。
3. **后台展品设计**：GWorkspace 管理后台 → 个人档案 → 3D 建模。查看主题解释、源内容摘要、锚点、阅读阶段和下一门槛；调整意象、名称、主题、寓意和三色配色；设置精选/主题/往期收藏；锁定版本、预览历史、恢复并锁定。iframe 使用与展馆相同的模型渲染器，仅交换受校验的配方，不传登录令牌。
4. **文章成长**：1 次阅读建立主题；10 次展开章节；50 次增加正文摘录节点；200 次增加章节顺序连线，之后按 2,000、20,000 等十倍门槛增加有预算上限的细节。最多抽取六个章节及其首个文本行，跳过代码围栏中的伪标题；连线只表示原文顺序，不虚构论证或因果关系。完整展签解释成长阶段并展示章节/摘录。
5. **循环林地**：沿纵向循环的 48 单位林径，渲染当前及前后相邻区块；跨边界同步平移角色与相机。周期性地面、弯曲石径和按区块变化的林间空地延续探索感，不会随行走无限增加对象。树木可见性与碰撞共用规则。回声使用最近的周期副本，完整显现且玩家靠近时停留，保留暂停、全文阅读、减少动态效果和随时退出。
6. **策展目录**：展馆内「查看全部收藏」提供入口精选、主题筛选、搜索和往期收藏。每次从目录进入最多八件作品，主题侧室至多四件，叙事/思想与每日赠语至多两件；主题路线可直接前往选定区域。内容增长不要求在无限长的走廊中寻找。原 world API 默认每馆十二件的兼容上限保留，全目录不受该上限限制。

## 持久化与接口

迁移 `023_artifact_curation.sql` 新增：

| 表 | 职责 |
| --- | --- |
| `gellaria_artifact_controls` | 每个模型的锁定、策展分组、人工覆盖字段及更新时间 |
| `gellaria_artifact_audit` | 保存、锁定、恢复操作的审计记录 |
| `blog_read_receipts` | 每篇文章与匿名化读者标识的最近计数时间 |

原 `gellaria_artifact_events` 保存完整历史配方。管理写入必须携带当前 `revision`，过期返回 409，避免多标签页覆盖。锁定阻止正文编辑与阅读量触发的自动重建；锁定中的手动改色/改名保留原来的内容和成长阶段。解除锁定才追赶最新内容与阅读门槛。恢复历史创建新版本并自动锁定，不删除历史。撤回发布的模型仍可管理，但不会进入公开目录。

- `GET /api/admin/content/artifacts`
- `GET /api/admin/content/artifacts/:id`
- `PUT /api/admin/content/artifacts/:id`

以上均使用现有管理员鉴权。编辑请求示例：

```json
{
  "revision": 4,
  "locked": true,
  "collection": "featured",
  "overrides": { "name": "论断与证据校验台", "colors": ["#7b9cbd", "#b9b2d7", "#e1f1ed"] }
}
```

公开目录：`GET /api/public/world/catalog?region=workshop&collection=all&page=1`，可选 `theme`、`search`、`locale`。`region` 仅支持 workshop / observatory，`collection` 支持 all / featured / archive，单页八件。响应包含 `region`、`page`、`pages`、`pageSize`、`total`、`themes`、`exhibits`、`updatedAt`，展品沿用 world 的字段。Gellaria 通过 `/explore/api/catalog` 转发，失败显示可恢复的提示。

模型 v2 配方新增可选 `design.narrative`，旧配方仍可渲染：

```json
{
  "chapters": [{ "title": "共享状态", "excerpt": "正文中的第一段文字。" }],
  "phase": "chapters",
  "relation": "document-order"
}
```

公开查询遵守原发布规则及项目 `gellaria` surface，GET 不触发建模。目录缓存 30 秒，允许 120 秒 stale-while-revalidate；Gellaria 内容缓存可能进一步延迟更新。正在观察的模型不因其他人的阅读突然改变。

## 阅读去重与边界

同一读者对同篇文章在 30 分钟内重复调用阅读接口只计一次。登录用户按用户 ID，匿名用户按 IP 与 User-Agent 的 HMAC 标识，数据库不保存原始 IP。这是防止普通刷新重复计数的启发式规则，不是反作弊系统；同网络同浏览器的匿名访客可能合并。阅读与模型升级仍处于同一数据库事务，`POST /api/blogs/:id/views` 的 `{views}` 响应保持兼容。

林地是有限区块循环，不是真正无限地形；横向仍有行走边界。模型仍为受限的确定性程序化配方，不声称自动理解所有新主题或生成独立 GLB。后台允许人工修正。公开目录目前在后端组装公开内容后分页，条目规模显著增长时应进一步改为数据库查询分页。

## 配置与迁移

后台预览需配置 `VITE_GELLARIA_URL` 为 Gellaria 站点 origin；Gellaria 的 `NEXT_PUBLIC_GWORKSPACE_URL` 为允许嵌入预览的 GWorkspace origin。无配置时沿用已有默认地址。修改这两个前端变量后需重新构建。预览校验发送窗口、origin 和完整配方，不接受代码。

启动后端会确保迁移并回填。也可手动执行：

```bash
bash scripts/run-with-backend-node.sh node backend/scripts/backfill-gellaria-artifacts.js
bash scripts/run-with-backend-node.sh npm --prefix backend run check:artifact-curation
bash scripts/run-with-backend-node.sh npm --prefix backend run check:gellaria-artifacts
npm run check:world-content
npm run check:resume
npm run test:gellaria
npm run typecheck:gellaria
npm run lint:gellaria
npm run build:all
```

本地迁移前备份：`/tmp/gworkspace-experience-WYXuuU/before.db`；浏览器操作使用同目录 `preview.db` 副本。正式本地库回填 43 条绑定，最终有 88 条模型历史（包含此前版本），重复执行未产生多余版本，外键检查无错误。测试账户与浏览器修改仅存在于预览副本。

## 验证记录

自动化覆盖：模型编辑/锁定/解锁/历史恢复、版本冲突、管理员权限、章节成长、阅读去重、超过十二件作品的完整分页、归档与撤回过滤；林径正反向跨界、长期坐标稳定、周期路径接缝及各空地的碰撞一致性。

- 前端 18 个测试文件、66 项测试通过；包括靠近时继续逐字显现、完成后停留、离开后恢复，以及减少动态效果的时间行为。lint、TypeScript 通过。
- 后端 `check:artifact-curation`、`check:gellaria-artifacts` 通过；`check:world-content` 与简历导入/API 兼容性检查通过。并发重复阅读只记一次；锁定后的手动改名不吸收新正文或阅读成长。
- 浏览器验证 CiteAI / Vana / Oceannect 的三步演示，近看视角按钮、重置、完整展签和分层 Esc 返回；手机 390×844 下验证文章近看、章节摘录、键盘操作及减少动态效果。
- 后台验证真实模型预览、改名改色保存、历史预览、恢复并锁定、刷新后持久化、恢复自动建模；手机无横向溢出，无效配方不会替换当前有效模型。
- 林地验证连续向前、向后跨越循环边界；暂停/继续、完整阅读与静态阅读；复查桌面和手机截图。额外修正空地隐形碰撞、近镜文字超出屏幕及侧面地面露边。
- 目录验证两页真实项目、主题筛选、空归档、进入筛选后的展室，以及模拟 503 后重新载入。失败不撤掉当前展厅。
- 开发服务器修正 Next.js 热更新 WebSocket 转发，防止管理预览 iframe 不断刷新。有效操作复查无控制台错误；开发环境仍有 React 严格模式的初始 WebSocket 关闭及已有 `THREE.Clock` 弃用警告。故障模拟预期产生一次 503。
- 截图位于 `output/playwright/`：`citeai-demo-complete.png`、`vana-inspection.png`、`oceannect-inspection.png`、`article-inspection-mobile.png`、`article-chapters-mobile.png`、`forest-loop-forward.png`、`forest-loop-desktop.png`、`forest-loop-mobile.png`、`forest-reader-mobile.png`、`collection-catalog.png`、`atelier-preview.png`、`atelier-mobile.png`。

- GWorkspace 的 Vite 生产构建和 Gellaria 的 Next.js 生产构建均通过。最终 Gellaria 构建没有使用临时的本地 GWorkspace 前端地址；构建产物中未发现 `http://127.0.0.1:4175`。
- 使用最终生产构建再次验证目录、近看、真实鼠标拖动旋转、滚轮缩放、重置与回到原位置，以及林地跨界到第二段旅途。控制台无错误，剩余一类已有的 `THREE.Clock` 弃用警告。补充截图：`inspection-production.png`、`inspection-orbit-before.png`、`inspection-orbit-after.png`。
- `git diff --check` 通过。临时预览服务在检查后停止，备份和预览数据库保留在上述目录。浏览器的移动检查为 390×844 视口模拟，不等同于低端手机的性能基准。
