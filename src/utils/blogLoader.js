/**
 * 博客文章加载器
 * 从文件系统中加载Markdown格式的博客文章
 * 元数据存储在独立的JSON文件中，内容存储在Markdown文件中
 * 实现博客信息和内容的完全解耦
 */

/**
 * 获取所有文章元数据文件
 * 使用Vite的glob导入功能动态加载所有meta.json文件
 */
const metaModules = import.meta.glob('/src/posts/**/meta.json', { 
  eager: true
})

/**
 * 获取所有文章内容文件
 * 使用Vite的glob导入功能动态加载所有index.md文件
 */
const contentModules = import.meta.glob('/src/posts/**/index.md', { 
  eager: true,
  as: 'raw'
})

/**
 * 从文件路径提取文章slug
 * @param {string} path - 文件路径
 * @returns {string} 文章slug
 */
function extractSlugFromPath(path) {
  // 从路径 /src/posts/2025-05-20-article-name/meta.json 或 index.md 提取 2025-05-20-article-name
  const match = path.match(/\/src\/posts\/([^/]+)\/(?:meta\.json|index\.md)/)
  return match ? match[1] : null
}

/**
 * 合并文章元数据和内容
 * @param {Object} meta - 文章元数据
 * @param {string} content - 文章内容
 * @param {string} slug - 文章slug
 * @returns {Object} 完整的文章对象
 */
function mergeArticleData(meta, content, slug) {
  return {
    id: meta.id,
    title: meta.title,
    genre: meta.genre || meta.category,
    category: meta.category || meta.genre,
    date: meta.date,
    excerpt: meta.excerpt,
    content: content.trim(),
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    views: meta.views || 0,
    likes: meta.likes || 0,
    comments: meta.comments || 0,
    slug: slug,
    // 图片资源路径前缀（相对于文章文件夹）
    imageBasePath: `/src/posts/${slug}/images/`
  }
}

/**
 * 加载所有博客文章
 * @returns {Array} 文章数组，按日期倒序排列
 */
export function loadBlogPosts() {
  const articles = []
  const metaMap = new Map()
  const contentMap = new Map()
  
  // 加载所有元数据
  for (const path in metaModules) {
    const slug = extractSlugFromPath(path)
    if (!slug) continue
    
    try {
      const module = metaModules[path]
      // Vite导入JSON文件时，默认导出就是JSON对象
      const meta = module?.default || module
      
      if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
        metaMap.set(slug, meta)
      } else {
        console.warn(`Invalid meta.json format for article: ${slug}`, meta)
      }
    } catch (error) {
      console.error(`Error loading meta.json for ${slug}:`, error)
    }
  }
  
  // 加载所有内容
  for (const path in contentModules) {
    const slug = extractSlugFromPath(path)
    if (!slug) continue
    
    try {
      const module = contentModules[path]
      const content = typeof module === 'string' ? module : (module.default || '')
      
      if (content && typeof content === 'string') {
        contentMap.set(slug, content)
      }
    } catch (error) {
      console.error(`Error loading index.md for ${slug}:`, error)
    }
  }
  
  // 合并元数据和内容
  for (const slug of metaMap.keys()) {
    const meta = metaMap.get(slug)
    const content = contentMap.get(slug)
    
    if (!content) {
      console.warn(`Missing content (index.md) for article: ${slug}`)
      continue
    }
    
    if (!meta) {
      console.warn(`Missing metadata (meta.json) for article: ${slug}`)
      continue
    }
    
    // 验证必需字段
    if (!meta.id || !meta.title || !meta.date) {
      console.warn(`Missing required fields in meta.json for article: ${slug}`, {
        id: meta.id,
        title: meta.title,
        date: meta.date
      })
      continue
    }
    
    try {
      const article = mergeArticleData(meta, content, slug)
      articles.push(article)
    } catch (error) {
      console.error(`Error merging article data for ${slug}:`, error)
    }
  }
  
  // 输出加载结果（开发环境）
  if (import.meta.env?.DEV) {
    console.log(`[BlogLoader] Loaded ${articles.length} articles from ${metaMap.size} folders`)
  }
  
  // 按日期倒序排列（最新的在前）
  return articles.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateB - dateA
  })
}

/**
 * 根据ID获取单篇文章
 * @param {number} id - 文章ID
 * @returns {Object|null} 文章对象或null
 */
export function getBlogPostById(id) {
  const posts = loadBlogPosts()
  return posts.find(post => post.id === id) || null
}

/**
 * 根据slug获取单篇文章
 * @param {string} slug - 文章slug
 * @returns {Object|null} 文章对象或null
 */
export function getBlogPostBySlug(slug) {
  const posts = loadBlogPosts()
  return posts.find(post => post.slug === slug) || null
}

/**
 * 获取文章图片URL
 * @param {string} slug - 文章slug
 * @param {string} imageName - 图片文件名
 * @returns {string} 图片URL
 */
export function getArticleImageUrl(slug, imageName) {
  return `/src/posts/${slug}/images/${imageName}`
}
