/**
 * 工作台核心工具配置
 * 保留真正会在站内使用的写作与轻量操作能力
 */

export const toolsConfig = [
  {
    id: 'time-suite',
    nameKey: 'tools.timeSuite.title',
    descriptionKey: 'tools.toolDescriptions.timeSuite',
    iconName: 'ClockIcon',
    badgeKey: 'tools.workspace.badges.utility',
    categoryKey: 'tools.workspace.categories.utility',
    keywords: ['time', 'clock', 'timer', 'stopwatch', 'pomodoro', '时间', '计时', '番茄钟'],
    defaultPinned: true,
    workspaceGroup: 'utility',
    workspacePadding: 'compact'
  },
  {
    id: 'calculator',
    nameKey: 'tools.calculator',
    descriptionKey: 'tools.toolDescriptions.calc',
    iconName: 'CalculatorIcon',
    badgeKey: 'tools.workspace.badges.utility',
    categoryKey: 'tools.workspace.categories.utility',
    keywords: ['calculator', 'math', 'scientific', '计算器', '函数', '科学计算'],
    defaultPinned: true,
    workspaceGroup: 'utility',
    workspacePadding: 'compact'
  },
  {
    id: 'json',
    nameKey: 'tools.json',
    descriptionKey: 'tools.toolDescriptions.json',
    iconName: 'FileCodeIcon',
    badgeKey: 'tools.workspace.badges.utility',
    categoryKey: 'tools.workspace.categories.utility',
    keywords: ['json', 'format', 'minify', '格式化', '压缩'],
    defaultPinned: true,
    workspaceGroup: 'utility',
    workspacePadding: 'default'
  },
  {
    id: 'encoder',
    nameKey: 'tools.encoder',
    descriptionKey: 'tools.toolDescriptions.encode',
    iconName: 'CodeIcon',
    badgeKey: 'tools.workspace.badges.utility',
    categoryKey: 'tools.workspace.categories.utility',
    keywords: ['base64', 'url', 'encode', 'decode', '编码', '解码'],
    defaultPinned: true,
    workspaceGroup: 'utility',
    workspacePadding: 'default'
  },
  {
    id: 'thesis-parser',
    nameKey: 'tools.thesisParser.title',
    descriptionKey: 'tools.toolDescriptions.thesisParser',
    iconName: 'BrainIcon',
    badgeKey: 'tools.workspace.badges.featured',
    categoryKey: 'tools.workspace.categories.writing',
    keywords: ['thesis', 'analysis', 'thinking', 'proposition', '命题', '拆句'],
    defaultPinned: true,
    workspaceGroup: 'writing',
    workspacePadding: 'default'
  },
  {
    id: 'blog-assistant',
    nameKey: 'tools.blogAssistant.title',
    descriptionKey: 'tools.toolDescriptions.blogAssistant',
    iconName: 'ArticleIcon',
    badgeKey: 'tools.workspace.badges.featured',
    categoryKey: 'tools.workspace.categories.publishing',
    keywords: ['blog', 'publish', 'summary', 'slug', '博客', '发布'],
    defaultPinned: false,
    workspaceGroup: 'writing',
    workspacePadding: 'default'
  },
  {
    id: 'markdown',
    nameKey: 'tools.markdown',
    descriptionKey: 'tools.toolDescriptions.markdown',
    iconName: 'FileTextIcon',
    badgeKey: 'tools.workspace.badges.writing',
    categoryKey: 'tools.workspace.categories.drafting',
    keywords: ['markdown', 'writing', 'preview', '草稿'],
    defaultPinned: false,
    workspaceGroup: 'writing',
    workspacePadding: 'default'
  },
  {
    id: 'cottee',
    nameKey: 'tools.cottee.title',
    descriptionKey: 'tools.toolDescriptions.cottee',
    iconName: 'BookIcon',
    badgeKey: 'tools.workspace.badges.future',
    categoryKey: 'tools.workspace.categories.lab',
    keywords: ['cottee', '口替', 'writing', 'automation', '写作自动化'],
    defaultPinned: false,
    workspaceGroup: 'lab',
    disabled: true,
    workspacePadding: 'default'
  }
]
