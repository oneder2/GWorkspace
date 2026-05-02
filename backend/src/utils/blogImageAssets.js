import { Blog } from '../models/Blog.js'
import { extractR2KeyFromUrl } from './r2.js'

const URL_PATTERN = /https?:\/\/[^\s<>"')]+/g

const extractUrls = (value) => {
  if (!value || typeof value !== 'string') return []
  return value.match(URL_PATTERN) || []
}

export const scanBlogImageReferences = () => {
  const blogs = Blog.getAll({
    status: null,
    sortBy: 'updated_at',
    sortOrder: 'desc'
  })
  const references = new Map()

  blogs.forEach(blog => {
    const seenKeys = new Set()
    const content = [blog.content, blog.excerpt].filter(Boolean).join('\n')

    extractUrls(content).forEach(url => {
      const key = extractR2KeyFromUrl(url)
      if (!key || !key.startsWith('blog/') || seenKeys.has(key)) {
        return
      }

      seenKeys.add(key)

      if (!references.has(key)) {
        references.set(key, [])
      }

      references.get(key).push({
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        status: blog.status
      })
    })
  })

  return {
    references,
    referenced_keys: [...references.keys()],
    blogs_count: blogs.length
  }
}
