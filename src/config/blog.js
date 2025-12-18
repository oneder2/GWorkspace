/**
 * 博客页面配置文件
 * 包含文章、标签和归档配置
 */

export const blogPostsConfig = [
  { 
    id: 1, 
    title: 'Reimagining the Personal Web', 
    category: 'Design', 
    date: '2025-05-20', 
    excerpt: 'How Glassmorphism brings depth and context back to flat design interfaces. Exploring the aesthetic of transparency.' 
  },
  { 
    id: 2, 
    title: 'The Zen of Vue Composition API', 
    category: 'Code', 
    date: '2025-05-18', 
    excerpt: 'Moving away from Options API was difficult at first, but the logic reuse capabilities are unmatched in large applications.' 
  },
  { 
    id: 3, 
    title: 'Frontend Trends 2025', 
    category: 'Tech', 
    date: '2025-05-10', 
    excerpt: 'From AI-generated components to Rust-based bundlers, the landscape is changing faster than ever. Here is what you need to know.' 
  },
]

export const blogTagsConfig = [
  { name: 'Tech', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  { name: 'Life', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
  { name: 'Coding', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  { name: 'Design', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
]

export const blogArchivesConfig = [
  { month: 'May 2025', count: 3 },
  { month: 'April 2025', count: 1 },
]
