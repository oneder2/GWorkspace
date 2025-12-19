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
    excerpt: 'How Glassmorphism brings depth and context back to flat design interfaces. Exploring the aesthetic of transparency.',
    content: 'Glassmorphism has emerged as a design trend that brings depth and context back to flat design interfaces. This aesthetic of transparency creates a sense of layering and hierarchy that was missing in the flat design era.\n\nBy using backdrop filters and semi-transparent elements, designers can create interfaces that feel more natural and intuitive. The blur effect adds depth without overwhelming the user, while the transparency allows for better context awareness.\n\nIn this article, we explore how to implement glassmorphism in modern web applications, the best practices, and when to use this design pattern effectively.',
    tags: ['Design', 'UI/UX']
  },
  { 
    id: 2, 
    title: 'The Zen of Vue Composition API', 
    category: 'Code', 
    date: '2025-05-18', 
    excerpt: 'Moving away from Options API was difficult at first, but the logic reuse capabilities are unmatched in large applications.',
    content: 'The Vue Composition API represents a fundamental shift in how we write Vue components. While the Options API is still perfectly valid, the Composition API offers better code organization and logic reuse.\n\nOne of the key advantages is the ability to extract and share logic between components. This is especially valuable in large applications where similar functionality appears across multiple components.\n\nIn this article, we\'ll explore the Composition API patterns, best practices, and how to migrate from Options API gradually.',
    tags: ['Vue', 'JavaScript', 'Coding']
  },
  { 
    id: 3, 
    title: 'Frontend Trends 2025', 
    category: 'Tech', 
    date: '2025-05-10', 
    excerpt: 'From AI-generated components to Rust-based bundlers, the landscape is changing faster than ever. Here is what you need to know.',
    content: 'The frontend development landscape is evolving at an unprecedented pace. In 2025, we\'re seeing several key trends that are reshaping how we build web applications.\n\nAI-generated components are becoming more sophisticated, allowing developers to create UI elements faster than ever. Rust-based bundlers like Turbopack are offering significant performance improvements.\n\nServer components are gaining traction, blurring the line between client and server rendering. And the rise of edge computing is changing how we think about application architecture.\n\nThis article covers the most important trends and what they mean for frontend developers.',
    tags: ['Tech', 'Frontend', 'Trends']
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
