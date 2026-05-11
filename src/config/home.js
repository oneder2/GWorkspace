/**
 * 首页配置文件
 * 包含快捷链接配置
 */

export const quickLinksConfig = [
  { 
    nameKey: 'home.quickLinks.github',
    url: 'https://github.com', 
    iconName: 'GitHubIcon', 
    color: 'bg-slate-900' 
  },
  { 
    nameKey: 'home.quickLinks.youtube',
    url: 'https://youtube.com', 
    iconName: 'YouTubeIcon', 
    color: 'bg-red-600' 
  },
  { 
    nameKey: 'home.quickLinks.gmail',
    url: 'https://gmail.com', 
    iconName: 'GmailIcon', 
    color: 'bg-green-600' 
  },
  { 
    nameKey: 'home.quickLinks.gemini',
    url: 'https://gemini.google.com', 
    iconName: 'GeminiIcon', 
    color: 'bg-blue-600' 
  },
]

export const homeProfileConfig = {
  status: {
    zh: '最近在整理这个角落的光线与秩序，让它更接近一处可以久留的个人空间。',
    en: 'Lately I have been adjusting the light and order of this corner so it feels more like a personal place worth lingering in.'
  },
  slogan: {
    zh: '愿这里既能安放好奇，也能容纳尚未说完的话。',
    en: 'May this place hold both curiosity and the things not yet fully said.'
  },
  tasks: {
    zh: ['完善首页个人信息层', '接入 Spotify 正在听卡片', '把待办任务前置到首页'],
    en: ['Refine the homepage identity layer', 'Wire in the Spotify now-playing card', 'Surface tasks on the front page']
  }
}
