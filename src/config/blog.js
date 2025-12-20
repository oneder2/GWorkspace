/**
 * 博客页面配置文件
 * 从文件系统加载文章，支持Markdown格式和图片资源
 * 
 * 文章存储结构：
 * src/posts/
 *   ├── 2025-05-20-article-slug/
 *   │   ├── meta.json         # 文章元数据（JSON格式）
 *   │   ├── index.md          # 文章内容（纯Markdown，无Frontmatter）
 *   │   └── images/           # 文章图片资源（可选）
 *   │       ├── image1.jpg
 *   │       └── image2.png
 *   └── 2025-05-18-another-article/
 *       ├── meta.json
 *       ├── index.md
 *       └── images/
 */

import { loadBlogPosts } from '../utils/blogLoader'

/**
 * 博客文章配置
 * 从文件系统动态加载所有文章
 */
export const blogPostsConfig = loadBlogPosts()

/**
 * 标签配置（已废弃，标签现在从文章动态生成）
 * 保留用于向后兼容，实际标签从文章数据中动态提取
 * @deprecated 使用动态生成的标签
 */
export const blogTagsConfig = [
  { name: 'Tech', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  { name: 'Life', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-green-400' },
  { name: 'Coding', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  { name: 'Design', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
]

/**
 * 归档配置（已废弃，归档现在从文章动态生成）
 * 保留用于向后兼容，实际归档从文章数据中动态生成
 * @deprecated 使用动态生成的归档
 */
export const blogArchivesConfig = [
  { month: 'May 2025', count: 3 },
  { month: 'April 2025', count: 1 },
]
