/**
 * 工作台外部资源配置
 * 外链强调快速抵达，不在站内重复实现成熟服务
 */

export const sitesConfig = [
  {
    id: 'ai-search',
    nameKey: 'workspace.externalGroups.aiSearch.title',
    descriptionKey: 'workspace.externalGroups.aiSearch.description',
    iconName: 'GeminiIcon',
    links: [
      { id: 'chatgpt', title: 'ChatGPT', url: 'https://chat.openai.com', descKey: 'workspace.links.chatgpt', tags: ['ai', 'writing', 'chat'] },
      { id: 'openai-api', title: 'OpenAI API', url: 'https://platform.openai.com/docs', descKey: 'workspace.links.openaiApi', tags: ['api', 'ai', 'docs'] },
      { id: 'gemini', title: 'Gemini', url: 'https://gemini.google.com/', descKey: 'workspace.links.gemini', tags: ['ai', 'google', 'chat'] },
      { id: 'wolfram-alpha', title: 'WolframAlpha', url: 'https://www.wolframalpha.com/', descKey: 'workspace.links.wolframAlpha', tags: ['search', 'math', 'knowledge'] }
    ]
  },
  {
    id: 'dev-deploy',
    nameKey: 'workspace.externalGroups.devDeploy.title',
    descriptionKey: 'workspace.externalGroups.devDeploy.description',
    iconName: 'CodeIcon',
    links: [
      { id: 'github', title: 'GitHub', url: 'https://github.com', descKey: 'workspace.links.github', tags: ['code', 'repo', 'publish'] },
      { id: 'cloudflare', title: 'Cloudflare', url: 'https://dash.cloudflare.com/', descKey: 'workspace.links.cloudflare', tags: ['dns', 'cdn', 'deploy'] },
      { id: 'vercel', title: 'Vercel', url: 'https://vercel.com', descKey: 'workspace.links.vercel', tags: ['deploy', 'env', 'frontend'] }
    ]
  },
  {
    id: 'media-content',
    nameKey: 'workspace.externalGroups.mediaContent.title',
    descriptionKey: 'workspace.externalGroups.mediaContent.description',
    iconName: 'YouTubeIcon',
    links: [
      { id: 'spotify', title: 'Spotify', url: 'https://open.spotify.com/', descKey: 'workspace.links.spotify', tags: ['music', 'listen'] },
      { id: 'youtube', title: 'YouTube', url: 'https://www.youtube.com/', descKey: 'workspace.links.youtube', tags: ['video', 'media'] }
    ]
  },
  {
    id: 'diagram-data',
    nameKey: 'workspace.externalGroups.diagramData.title',
    descriptionKey: 'workspace.externalGroups.diagramData.description',
    iconName: 'LayoutIcon',
    links: [
      { id: 'drawio', title: 'Draw.io', url: 'https://app.diagrams.net/', descKey: 'workspace.links.drawio', tags: ['diagram', 'flowchart'] },
      { id: 'drawdb', title: 'drawDB', url: 'https://drawdb.app/', descKey: 'workspace.links.drawdb', tags: ['database', 'diagram'] }
    ]
  },
  {
    id: 'format-tools',
    nameKey: 'workspace.externalGroups.formatTools.title',
    descriptionKey: 'workspace.externalGroups.formatTools.description',
    iconName: 'ToolIcon',
    links: [
      { id: 'toolwa', title: '工具哇', url: 'https://www.toolwa.com/', descKey: 'workspace.links.toolwa', tags: ['tools', 'utility'] },
      { id: 'file-format-factory', title: '文件格式工厂', url: 'https://www.alltoall.net/', descKey: 'workspace.links.fileFormatFactory', tags: ['file', 'convert'] },
      { id: 'image-format-factory', title: '图片格式工厂', url: 'https://www.gaitubao.com/', descKey: 'workspace.links.imageFormatFactory', tags: ['image', 'convert'] }
    ]
  },
  {
    id: 'friends',
    nameKey: 'workspace.externalGroups.friends.title',
    descriptionKey: 'workspace.externalGroups.friends.description',
    iconName: 'LinkIcon',
    links: [
      { id: 'yysuni', title: 'YYSUNI', url: 'https://www.yysuni.com/', descKey: 'workspace.links.yysuni', tags: ['friend'] },
      { id: 'elysiumstack', title: 'ElysiumStack', url: 'https://www.elysium-stack.cn/', descKey: 'workspace.links.elysiumstack', tags: ['friend'] }
    ]
  }
]
