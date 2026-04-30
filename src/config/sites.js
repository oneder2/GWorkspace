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
      { title: 'GitHub', url: 'https://github.com', desc: '开源永远的扛把子' },
      { title: 'Stack Overflow', url: 'https://stackoverflow.com', desc: '古法编程修炼圣地' },
      { title: 'MDN Web Docs', url: 'https://developer.mozilla.org', desc: '传说中的MDN' },
      { title: 'Vue.js', url: 'https://vuejs.org', desc: '这个站就是用它写的' },
      { title: 'Tailwind CSS', url: 'https://tailwindcss.com', desc: '现在AI在样式上离不开它了' },
      { title: 'Regex101', url: 'https://regex101.com', desc: '正则表达式骨灰网站' },
      { title: 'Vercel', url: 'https://vercel.com', desc: '快速启动与低成本维护之最' },
      { title: '菜鸟教程', url: 'https://www.runoob.com', desc: '菜鸟教程，学的不仅是技术，更是梦想！' },
    ]
  },
  {
    id: 'tools',
    name: 'Tools',
    iconName: 'ToolIcon',
    links: [
      { title: 'Strudel', url: 'https://strudel.cc', desc: '代码编曲，程序员的艺术执着' },
      { title: 'Beepbox', url:"https://beepbox.co/", desc: '适合快速制作简单音效和编曲' },
      { title: 'WolframAlpha', url:"https://www.wolframalpha.com/", desc: '有关数学的一切' },
      { title: '工具蛙', url:"https://toolwa.com", desc: '老牌线上工具箱' },
    ]
  },
  {
    id: 'ai',
    name: 'AI chatbots',
    iconName: 'BrainIcon',
    links: [
      { title: 'Gemini', url: 'https://gemini.google.com', desc: '哈基米，多模态之最' },
      { title: 'Qwen', url: 'https://chat.qwen.ai', desc: '千问，中文开源之最' },
      { title: 'ChatGPT', url: 'https://chat.openai.com', desc: 'GPT，希望它们再活得久一点' },
      { title: 'Claude', url: 'https://claude.ai', desc: 'CC，现在急需一个区分点' },
      { title: 'Perplexity', url: 'https://www.perplexity.ai', desc: 'Perplexity，性价比高' },
      { title: 'Grok', url: 'https://grok.com', desc: 'Grok，老马的野望' },
    ]
  },
  {
    id: 'design',
    name: 'Design',
    iconName: 'PaintIcon',
    links: [
      { title: 'Canva', url: 'https://www.canva.com/', desc: '在线2D设计，免费版很良心了' },
      { title: 'Krita', url: 'https://docs.krita.org/en/', desc: '我的主力绘画软件，可惜厚涂支持一般' },
      { title: 'Inkscape', url: 'https://inkscape.org/', desc: '矢量图绘制，我严重怀疑有在线工具平替' },
      { title: 'GIMP', url: 'https://www.gimp.org/', desc: '没人喜欢GIMP :(' },
      { title: 'Blender', url: 'https://www.blender.org/', desc: '所有人都喜欢Blender :)' },
      { title: 'Kdenlive', url: 'https://kdenlive.org/', desc: '其实如果重型使用，推荐达芬奇' },
      { title: 'Audacity', url: 'https://www.audacityteam.org/', desc: '音频编辑器' },
      { title: 'OBS', url: 'https://obsproject.com/', desc: '如雷贯耳，但是用的少' },
      { title: 'Handbrake', url: 'https://handbrake.fr/', desc: '视频格式转换器' },
      { title: 'VLC', url: 'https://www.videolan.org/vlc/', desc: '那个一直存在与父亲电脑中的路障' },
    ]
  },
  {
    id: 'learn',
    name: 'Learning',
    iconName: 'BookIcon',
    links: [
      { title: 'Hacker News', url: 'https://news.ycombinator.com', desc: '计算机科学相关新闻' },
      { title: 'Medium', url: 'https://medium.com', desc: '硬核文章富集处' },
      { title: 'Coursera', url: 'https://www.coursera.org', desc: '不知道学什么好，就来看看吧' },
      { title: 'Dev.to', url: 'https://dev.to', desc: '开发者的推特' }
    ]
  },
  {
    id: 'friends',
    name: '友站链接',
    iconName: 'LinkIcon',
    links: [
      { title: 'YYSUNI', url: 'https://www.yysuni.com/', desc: 'YYSUNI前辈，已经看不出来借鉴什么了' },
      { title: 'ElysiumStack', url: 'https://www.elysium-stack.cn/', desc: 'ElysiumStack，强大的设计能力惊艳了我' }
    ]
  }
]
