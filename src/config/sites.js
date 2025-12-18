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
      { title: 'Vercel', url: 'https://vercel.com', desc: 'Develop. Preview. Ship.' }
    ]
  },
  {
    id: 'design',
    name: 'Design',
    iconName: 'PaintIcon',
    links: [
      { title: 'Dribbble', url: 'https://dribbble.com', desc: 'Design inspiration' },
      { title: 'Behance', url: 'https://www.behance.net', desc: 'Showcase creative work' },
      { title: 'Figma', url: 'https://www.figma.com', desc: 'Interface design tool' },
      { title: 'Unsplash', url: 'https://unsplash.com', desc: 'The internet\'s source for visuals' },
      { title: 'Coolors', url: 'https://coolors.co', desc: 'Super fast color palettes' },
      { title: 'Phosphor Icons', url: 'https://phosphoricons.com', desc: 'Flexible icon family' }
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
