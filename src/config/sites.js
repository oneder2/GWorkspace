/**
 * 站点导航配置文件
 * 包含站点分类和链接配置
 */

export const sitesConfig = [
  {
    id: 'dev',
    name: 'Dev Tools',
    iconName: 'CodeIcon',
    links: [
      { title: 'GitHub', url: 'https://github.com', desc: 'Where the world builds software' },
      { title: 'Stack Overflow', url: 'https://stackoverflow.com', desc: 'Questions and answers' },
      { title: 'MDN Web Docs', url: 'https://developer.mozilla.org', desc: 'Resources for developers' },
      { title: 'Vue.js', url: 'https://vuejs.org', desc: 'The Progressive JavaScript Framework' },
      { title: 'Tailwind CSS', url: 'https://tailwindcss.com', desc: 'Rapidly build modern websites' },
      { title: 'Regex101', url: 'https://regex101.com', desc: 'Regular expression tester' },
      { title: 'Vercel', url: 'https://vercel.com', desc: 'Develop. Preview. Ship.' },
      { title: '菜鸟教程', url: 'https://www.runoob.com', desc: '菜鸟教程，学的不仅是技术，更是梦想！' },
    ]
  },
  {
    id: 'ai',
    name: 'AI chatbots',
    iconName: 'BrainIcon',
    links: [
      { title: 'Gemini', url: 'https://gemini.google.com', desc: 'Google\'s AI model' },
      { title: 'Qwen', url: 'https://chat.qwen.ai', desc: 'Alibaba\'s AI model' },
      { title: 'ChatGPT', url: 'https://chat.openai.com', desc: 'OpenAI\'s AI model' },
      { title: 'Claude', url: 'https://claude.ai', desc: 'Anthropic\'s AI model' },
      { title: 'Perplexity', url: 'https://www.perplexity.ai', desc: 'AI search engine' },
      { title: 'Grok', url: 'https://grok.com', desc: 'Grok\'s AI model' },
    ]
  },
  {
    id: 'design',
    name: 'Design',
    iconName: 'PaintIcon',
    links: [
      { title: 'UXBox', url: 'https://www.uxbot.cn/', desc: 'UI/UX design AI generatior' },
      { title: 'Canva', url: 'https://www.canva.com/', desc: 'Online 2D design' },
      { title: 'Krita', url: 'https://docs.krita.org/en/', desc: 'Open-source digital painting' },
      { title: 'Inkscape', url: 'https://inkscape.org/', desc: 'Open-source vector graphics editor' },
      { title: 'GIMP', url: 'https://www.gimp.org/', desc: 'Open-source image editor' },
      { title: 'Blender', url: 'https://www.blender.org/', desc: 'Open-source 3D modeling' },
      { title: 'Kdenlive', url: 'https://kdenlive.org/', desc: 'Open-source video editor' },
      { title: 'Audacity', url: 'https://www.audacityteam.org/', desc: 'Open-source audio editor' },
      { title: 'OBS', url: 'https://obsproject.com/', desc: 'Open-source video recording' },
      { title: 'Handbrake', url: 'https://handbrake.fr/', desc: 'Open-source video transcoder' },
      { title: 'VLC', url: 'https://www.videolan.org/vlc/', desc: 'Open-source media player' },
    ]
  },
  {
    id: 'learn',
    name: 'Learning',
    iconName: 'BookIcon',
    links: [
      { title: 'Hacker News', url: 'https://news.ycombinator.com', desc: 'Computer science news' },
      { title: 'Medium', url: 'https://medium.com', desc: 'Where good ideas find you' },
      { title: 'Coursera', url: 'https://www.coursera.org', desc: 'Build skills with courses' },
      { title: 'Dev.to', url: 'https://dev.to', desc: 'Developer community' }
    ]
  }
]
