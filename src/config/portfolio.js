/**
 * 作品集页面配置文件
 * 包含作品项目配置
 */

/**
 * 作品集页面配置文件
 * 包含作品项目配置
 * 
 * 图片路径说明：
 * - image: 预览图路径，相对于 public 目录（如：'/images/portfolio/glass-dashboard.jpg'）
 * - 如果未指定 image，将使用默认的渐变背景（color 字段）
 */

export const portfolioConfig = [
  { 
    title: 'Glass Dashboard', 
    desc: 'A personal dashboard template featuring heavy use of backdrop-filter and vibrant gradients.', 
    url: '/', 
    tags: ['Vue 3', 'Tailwind'], 
    iconName: 'LayoutIcon', 
    color: 'from-green-400 to-emerald-300',
    image: '/images/portfolio/glass-dashboard.jpg', // 预览图路径（可选）
  },
  { 
    title: 'CiteAI', 
    desc: 'AI-powered citation and research tool for academic writing and document management.', 
    url: 'https://citeai.co', 
    tags: ['AI', 'Research'], 
    iconName: 'ShoppingIcon', 
    color: 'from-purple-400 to-pink-300',
    image: '/images/portfolio/citeai.jpg', // 预览图路径（可选）
  },
  { 
    title: 'Portfolio', 
    desc: 'Personal portfolio website showcasing projects and professional experience.', 
    url: 'https://portfolio.gellaronline.cc', 
    tags: ['Web', 'Portfolio'], 
    iconName: 'ClockIcon', 
    color: 'from-orange-400 to-red-300',
    image: '/images/portfolio/portfolio.jpg', // 预览图路径（可选）
  },
]
