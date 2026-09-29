// Content interpretation is saved with each artifact, never evaluated as code.
// Existing works have individual designs; new works use the same content-based grammar.
export const DESIGN_GENERATOR = 'content-ateliers-v3.1'
export const ARTIFACT_MOTIF_NAMES = {
  'workspace-orrery': '内容权威中枢', 'citation-bench': '论断与证据校验台', 'offline-vault': '离线文档库',
  'web-periscope': '网站研究潜望镜', 'twilight-stage': '暮色解谜舞台', 'resume-typesetter': '双语排字台',
  'training-balance': '渐进训练仪', 'tidal-planner': '潮汐日程仪', 'memory-bridge': '双人记忆桥',
  'portfolio-frames': '作品视窗', 'simulation-reel': '模拟影片机', 'civilization-strata': '文明地层',
  'composition-tree': '逻辑复用树', 'glass-palimsest': '透明层叠窗', 'frontend-horizon': '前端技术地平线',
  'image-aperture': '影像光圈', 'data-weave': '信息编织架', 'code-prism': '代码执行棱镜', 'story-mobile': '叙事悬架'
}
export const ARTIFACT_MOTIFS = Object.keys(ARTIFACT_MOTIF_NAMES)
export function readingStage(views) {
  const count = Math.max(0, Math.floor(Number(views) || 0))
  const thresholds = [1, 10, 50, 200]
  for (let n = 2000; n <= Number.MAX_SAFE_INTEGER; n *= 10) thresholds.push(n)
  const level = thresholds.filter(n => count >= n).length
  return { level, threshold: level ? thresholds[level - 1] : 0, nextThreshold: thresholds[level] ?? null }
}

const designs = [
  ['workspace-orrery', /gworkspace/i, '内容权威中枢', '中央档案核通过轨道连接写作台、公开档案与三维世界。', ['档案核', '写作台', '发布轨道']],
  ['citation-bench', /citeai/i, '论断与证据校验台', '论断纸带经过检索透镜，与多源证据连线，最终形成引用页。', ['论断纸带', '检索透镜', '引用页']],
  ['offline-vault', /\bvana\b/i, '离线文档库', '本地抽屉承载文档，独立的同步拱环连接远端，出口对应多格式导出。', ['本地抽屉', '同步拱环', '导出书页']],
  ['web-periscope', /surfsmart/i, '网站研究潜望镜', '浏览窗口围绕研究透镜排列，采样轨道将网页片段汇集到分析台。', ['网页窗口', '采样轨道', '分析透镜']],
  ['twilight-stage', /twilight zone/i, '暮色解谜舞台', '侧视舞台、门框与分层剪影对应二维探索、解谜和寻找同伴。', ['侧视舞台', '谜题门框', '同伴灯火']],
  ['resume-typesetter', /结构化个人简历|bilingual resume/i, '双语排字台', '同一结构化源分出双语版面与网页、文档输出，保留共同书脊。', ['结构化书脊', '双语版面', '输出端']],
  ['training-balance', /farivy/i, '渐进训练仪', '杠铃、配重刻度与逐级抬高的训练曲线记录渐进超负荷。', ['杠铃', '配重片', '进度曲线']],
  ['tidal-planner', /潮汐计划|desktop planning/i, '潮汐日程仪', '同心时间盘连接任务签、每日提醒和项目周报，外沿形成潮汐波形。', ['时间盘', '任务签', '周报卷']],
  ['memory-bridge', /oceannect/i, '双人记忆桥', '两座伴侣节点由共享时间线相连，桥上镶嵌媒体记忆与纪念日。', ['伴侣节点', '时间线桥', '记忆珠']],
  ['portfolio-frames', /作品集站点|personal portfolio site/i, '作品视窗', '不同画幅围绕中央索引展开，表现视觉作品与项目经历的并置。', ['画框', '索引', '展页']],
  ['simulation-reel', /moblify/i, '模拟影片机', '物理轨道经过筛选闸门进入竖屏画框，再卷入成片胶轮。', ['模拟轨道', '筛选闸门', '竖屏胶轮']],
]

function interpret(payload) {
  const text = [payload.title, payload.alternateTitle, payload.summary, payload.content, ...payload.highlights].join(' ')
  if (payload.kind === 'project') {
    const known = designs.find(([, rule]) => rule.test(text))
    if (known) return { motif: known[0], name: known[2], rationale: known[3], parts: known[4], basis: 'curated-content' }
  }
  // Specific subject and document structure take priority over broad genre labels.
  const rules = [
    ['civilization-strata', /人类简史|sapiens|因果累加/i, '文明地层', '以时间地层、因果桥和不稳定的上升节点表现文章对文明进步代价的追问。', ['时间地层', '因果桥', '上升节点']],
    ['composition-tree', /composition api|逻辑复用|composables/i, '逻辑复用树', '共享主干向组件分枝，接合点代表从 Options API 逐步抽取逻辑。', ['共享主干', '组件枝', '接合点']],
    ['glass-palimsest', /glassmorphism|毛玻璃|磨砂玻璃/i, '透明层叠窗', '错位半透明窗片与框架表达景深、上下文和视觉层级。', ['透明窗片', '层级框架', '背景层']],
    ['frontend-horizon', /frontend trends|turbopack|server components/i, '前端技术地平线', '并列的构建、服务端与边缘计算节点沿技术演进轴展开。', ['构建节点', '服务端节点', '边缘环']],
    ['image-aperture', /图片测试|摄影|photograph/i, '影像光圈', '影像画幅、光圈与感光片表现图片内容，不虚构图片未说明的主题。', ['影像画幅', '光圈', '感光片']],
    ['data-weave', /维生素|表格|数据表|dataset/i, '信息编织架', '列表与表格被转译为经纬交织的分类格栅。', ['分类列', '记录行', '索引结']],
    ['code-prism', /print\(|hello world|编程|算法|代码/i, '代码执行棱镜', '输入、执行核心与输出脉冲呈现代码片段的运行顺序。', ['输入端', '执行核心', '输出脉冲']],
    ['citation-bench', /检索|引用|research|\bai\b/i, '知识检索台', '文档、透镜与证据链对应内容中的检索与推理。', ['文档', '透镜', '证据链']],
    ['memory-bridge', /伴侣|共享|连接|network/i, '连接之桥', '节点与桥梁表现内容中的共享与连接关系。', ['节点', '桥梁', '连接点']],
    ['offline-vault', /文档|写作|writing|document/i, '记录之库', '书页和索引抽屉表现内容的记录与整理。', ['书页', '抽屉', '索引']],
  ]
  const match = rules.find(([, rule]) => rule.test(text))
  if (match) return { motif: match[0], name: match[2], rationale: match[3], parts: match[4], basis: 'content-rules' }
  if (payload.structure?.images) return { motif: 'image-aperture', name: '影像光圈', rationale: '根据正文中的图片结构构造画幅与光圈。', parts: ['画幅', '光圈', '影像层'], basis: 'document-structure' }
  return { motif: 'story-mobile', name: '叙事悬架', rationale: '以正文段落和小节组成独立悬页；信息不足时保留抽象表达。', parts: ['段落页', '章节轴', '连接线'], basis: 'document-structure' }
}

export function designArtifact(payload, seed, previousLevel = 0) {
  const interpretation = interpret(payload)
  const tier = payload.kind === 'project' ? payload.surfaces?.some(s => ['resume_web', 'resume_pdf'].includes(s)) ? 'resume' : 'kinetic' : payload.kind === 'blog' ? 'reading' : 'support'
  const stage = readingStage(payload.views)
  const level = tier === 'reading' ? Math.max(previousLevel, stage.level) : 4
  const progression = tier === 'reading' ? readingStage(level <= 4 ? [0, 1, 10, 50, 200][level] : 200 * 10 ** (level - 4)) : { level: 4, threshold: 0, nextThreshold: null }
  const structure = payload.structure || { headings: [], paragraphs: 0, images: 0, codeBlocks: 0 }
  // Shape frequencies reflect document structure and technologies, not merely a title hash.
  const family = /连接|协作|network/i.test([payload.summary, ...payload.tags].join(' ')) ? 'torus-knot' : /生长|生态|自然|游戏/i.test(payload.summary) ? 'superformula' : 'lissajous'
  return {
    ...interpretation, tier, ...progression,
    subject: payload.title.slice(0, 120), synopsis: (payload.summary || payload.content).slice(0, 320),
    anchors: [...structure.headings, ...payload.highlights, ...payload.tags].slice(0, 8).map(v => v.slice(0, 100)),
    structure, geometry: { family, p: 2 + payload.tags.length % 3, q: 5, lobes: 3 + (structure.paragraphs + payload.tags.length) % 6, phase: seed / 100000 * Math.PI * 2 },
    narrative: {
      chapters: (payload.chapters || []).slice(0, 6),
      phase: level === 0 ? 'closed' : level === 1 ? 'subject' : level === 2 ? 'chapters' : level === 3 ? 'arguments' : 'connections',
      // Connections denote document order, not an invented causal relationship.
      relation: 'document-order'
    },
    // Detail grows continuously through the supported view milestones, with a hard GPU budget.
    segments: Math.min(224, 32 + level * 10), ornaments: Math.min(56, 2 + level * 3),
  }
}
