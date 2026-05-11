/**
 * 站点导航配置文件
 * 包含站点分类和链接配置
 */

export const sitesConfig = [
  {
    id: 'dev',
    nameKey: 'sites.categories.dev',
    iconName: 'CodeIcon',
    links: [
      { title: 'GitHub', url: 'https://github.com', descKey: 'sites.links.github' },
      { title: 'Stack Overflow', url: 'https://stackoverflow.com', descKey: 'sites.links.stackoverflow' },
      { title: 'MDN Web Docs', url: 'https://developer.mozilla.org', descKey: 'sites.links.mdn' },
      { title: 'Vue.js', url: 'https://vuejs.org', descKey: 'sites.links.vue' },
      { title: 'Tailwind CSS', url: 'https://tailwindcss.com', descKey: 'sites.links.tailwind' },
      { title: 'Regex101', url: 'https://regex101.com', descKey: 'sites.links.regex101' },
      { title: 'Vercel', url: 'https://vercel.com', descKey: 'sites.links.vercel' },
      { title: '菜鸟教程', url: 'https://www.runoob.com', descKey: 'sites.links.runoob' },
    ]
  },
  {
    id: 'tools',
    nameKey: 'sites.categories.tools',
    iconName: 'ToolIcon',
    links: [
      { title: 'Strudel', url: 'https://strudel.cc', descKey: 'sites.links.strudel' },
      { title: 'Beepbox', url:"https://beepbox.co/", descKey: 'sites.links.beepbox' },
      { title: 'WolframAlpha', url:"https://www.wolframalpha.com/", descKey: 'sites.links.wolframalpha' },
      { title: '工具蛙', url:"https://toolwa.com", descKey: 'sites.links.toolwa' },
      { title: 'iLoveSVG', url:"https://www.ilovesvg.com/", descKey: 'sites.links.ilovesvg' }
    ]
  },
  {
    id: 'ai',
    nameKey: 'sites.categories.ai',
    iconName: 'BrainIcon',
    links: [
      { title: 'Gemini', url: 'https://gemini.google.com', descKey: 'sites.links.gemini' },
      { title: 'Qwen', url: 'https://chat.qwen.ai', descKey: 'sites.links.qwen' },
      { title: 'ChatGPT', url: 'https://chat.openai.com', descKey: 'sites.links.chatgpt' },
      { title: 'Claude', url: 'https://claude.ai', descKey: 'sites.links.claude' },
      { title: 'Perplexity', url: 'https://www.perplexity.ai', descKey: 'sites.links.perplexity' },
      { title: 'Grok', url: 'https://grok.com', descKey: 'sites.links.grok' },
    ]
  },
  {
    id: 'design',
    nameKey: 'sites.categories.design',
    iconName: 'PaintIcon',
    links: [
      { title: 'Canva', url: 'https://www.canva.com/', descKey: 'sites.links.canva' },
      { title: 'Krita', url: 'https://docs.krita.org/en/', descKey: 'sites.links.krita' },
      { title: 'Inkscape', url: 'https://inkscape.org/', descKey: 'sites.links.inkscape' },
      { title: 'GIMP', url: 'https://www.gimp.org/', descKey: 'sites.links.gimp' },
      { title: 'Blender', url: 'https://www.blender.org/', descKey: 'sites.links.blender' },
      { title: 'Kdenlive', url: 'https://kdenlive.org/', descKey: 'sites.links.kdenlive' },
      { title: 'Audacity', url: 'https://www.audacityteam.org/', descKey: 'sites.links.audacity' },
      { title: 'OBS', url: 'https://obsproject.com/', descKey: 'sites.links.obs' },
      { title: 'Handbrake', url: 'https://handbrake.fr/', descKey: 'sites.links.handbrake' },
      { title: 'VLC', url: 'https://www.videolan.org/vlc/', descKey: 'sites.links.vlc' },
    ]
  },
  {
    id: 'learn',
    nameKey: 'sites.categories.learn',
    iconName: 'BookIcon',
    links: [
      { title: 'Hacker News', url: 'https://news.ycombinator.com', descKey: 'sites.links.hackernews' },
      { title: 'Medium', url: 'https://medium.com', descKey: 'sites.links.medium' },
      { title: 'Coursera', url: 'https://www.coursera.org', descKey: 'sites.links.coursera' },
      { title: 'Dev.to', url: 'https://dev.to', descKey: 'sites.links.devto' }
    ]
  },
  {
    id: 'friends',
    nameKey: 'sites.categories.friends',
    iconName: 'LinkIcon',
    links: [
      { title: 'YYSUNI', url: 'https://www.yysuni.com/', descKey: 'sites.links.yysuni' },
      { title: 'ElysiumStack', url: 'https://www.elysium-stack.cn/', descKey: 'sites.links.elysiumstack' }
    ]
  }
]
