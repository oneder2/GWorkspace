/**
 * 工具箱页面配置文件
 * 通过元数据驱动工作台分组、展示层级和默认固定项
 */

export const toolGroups = [
  {
    id: 'content',
    titleKey: 'tools.workspace.groups.content.title',
    descriptionKey: 'tools.workspace.groups.content.description'
  },
  {
    id: 'operations',
    titleKey: 'tools.workspace.groups.operations.title',
    descriptionKey: 'tools.workspace.groups.operations.description'
  },
  {
    id: 'utility',
    titleKey: 'tools.workspace.groups.utility.title',
    descriptionKey: 'tools.workspace.groups.utility.description'
  }
]

export const toolsConfig = [
  {
    id: 'blog-assistant',
    nameKey: 'tools.blogAssistant.title',
    descriptionKey: 'tools.toolDescriptions.blogAssistant',
    iconName: 'ArticleIcon',
    group: 'content',
    priority: 'primary',
    badgeKey: 'tools.workspace.badges.featured',
    defaultPinned: true,
    workspacePadding: 'default',
    keywords: ['blog', 'publish', 'summary', 'slug']
  },
  {
    id: 'markdown',
    nameKey: 'tools.markdown',
    descriptionKey: 'tools.toolDescriptions.markdown',
    iconName: 'FileTextIcon',
    group: 'content',
    priority: 'primary',
    badgeKey: 'tools.workspace.badges.writing',
    defaultPinned: true,
    workspacePadding: 'default',
    keywords: ['markdown', 'writing', 'preview']
  },
  {
    id: 'qrcode',
    nameKey: 'tools.qrCode',
    descriptionKey: 'tools.toolDescriptions.qrcode',
    iconName: 'QrCodeIcon',
    group: 'content',
    priority: 'primary',
    badgeKey: 'tools.workspace.badges.share',
    defaultPinned: false,
    workspacePadding: 'default',
    keywords: ['qr', 'share', 'poster']
  },
  {
    id: 'colorpicker',
    nameKey: 'tools.colorPicker',
    descriptionKey: 'tools.toolDescriptions.colorpicker',
    iconName: 'PaintIcon',
    group: 'content',
    priority: 'primary',
    badgeKey: 'tools.workspace.badges.visual',
    defaultPinned: false,
    workspacePadding: 'compact',
    keywords: ['color', 'palette', 'design']
  },
  {
    id: 'todo',
    nameKey: 'todo.title',
    descriptionKey: 'tools.toolDescriptions.todo',
    iconName: 'ListIcon',
    group: 'operations',
    priority: 'primary',
    badgeKey: 'tools.workspace.badges.workflow',
    defaultPinned: true,
    workspacePadding: 'default',
    keywords: ['todo', 'task', 'plan']
  },
  {
    id: 'pomodoro',
    nameKey: 'tools.pomodoro',
    descriptionKey: 'tools.toolDescriptions.pomodoro',
    iconName: 'TimerIcon',
    group: 'operations',
    priority: 'primary',
    badgeKey: 'tools.workspace.badges.focus',
    defaultPinned: true,
    workspacePadding: 'compact',
    keywords: ['focus', 'timer', 'pomodoro']
  },
  {
    id: 'json',
    nameKey: 'tools.json',
    descriptionKey: 'tools.toolDescriptions.json',
    iconName: 'FileCodeIcon',
    group: 'operations',
    priority: 'primary',
    badgeKey: 'tools.workspace.badges.quick',
    defaultPinned: false,
    workspacePadding: 'default',
    keywords: ['json', 'format', 'api']
  },
  {
    id: 'worldclock',
    nameKey: 'tools.worldClock.title',
    descriptionKey: 'tools.toolDescriptions.worldclock',
    iconName: 'ClockIcon',
    group: 'utility',
    priority: 'secondary',
    badgeKey: 'tools.workspace.badges.quick',
    defaultPinned: false,
    workspacePadding: 'compact',
    keywords: ['time', 'clock', 'timezone']
  },
  {
    id: 'calc',
    nameKey: 'tools.calculator',
    descriptionKey: 'tools.toolDescriptions.calc',
    iconName: 'CalculatorIcon',
    group: 'utility',
    priority: 'secondary',
    badgeKey: 'tools.workspace.badges.quick',
    defaultPinned: false,
    workspacePadding: 'compact',
    keywords: ['calc', 'math']
  },
  {
    id: 'stopwatch',
    nameKey: 'tools.stopwatch',
    descriptionKey: 'tools.toolDescriptions.stopwatch',
    iconName: 'StopwatchIcon',
    group: 'utility',
    priority: 'secondary',
    badgeKey: 'tools.workspace.badges.quick',
    defaultPinned: false,
    workspacePadding: 'compact',
    keywords: ['stopwatch', 'timing']
  },
  {
    id: 'encode',
    nameKey: 'tools.encoder',
    descriptionKey: 'tools.toolDescriptions.encode',
    iconName: 'CodeIcon',
    group: 'utility',
    priority: 'secondary',
    badgeKey: 'tools.workspace.badges.quick',
    defaultPinned: false,
    workspacePadding: 'default',
    keywords: ['encode', 'base64', 'url']
  }
]
