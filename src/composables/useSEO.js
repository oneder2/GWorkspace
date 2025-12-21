/**
 * SEO 管理组合式函数
 * 用于动态更新页面的 meta 标签、Open Graph、Twitter Card 等
 */

import { watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

/**
 * 默认 SEO 配置
 */
const defaultSEO = {
  title: 'GWorkspace - Personal Workspace',
  description: 'Personal workspace website with Vue.js, featuring blog, tools, and portfolio management.',
  keywords: 'workspace, blog, tools, portfolio, vue.js',
  image: '/og-image.jpg', // 需要添加默认 OG 图片
  url: typeof window !== 'undefined' ? window.location.origin : '',
  type: 'website'
}

/**
 * 更新或创建 meta 标签
 */
function updateMetaTag(name, content, attribute = 'name') {
  let element = document.querySelector(`meta[${attribute}="${name}"]`)
  
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.appendChild(element)
  }
  
  element.setAttribute('content', content)
}

/**
 * 更新或创建 link 标签（用于 canonical URL）
 */
function updateLinkTag(rel, href) {
  let element = document.querySelector(`link[rel="${rel}"]`)
  
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  
  element.setAttribute('href', href)
}

/**
 * 更新页面标题
 */
function updateTitle(title) {
  document.title = title
}

/**
 * 添加结构化数据（JSON-LD）
 */
function updateStructuredData(data) {
  // 移除旧的 structured data
  const oldScript = document.querySelector('script[type="application/ld+json"][data-seo]')
  if (oldScript) {
    oldScript.remove()
  }
  
  // 添加新的 structured data
  if (data) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-seo', 'true')
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
  }
}

/**
 * 使用 SEO 组合式函数
 * @param {Object} seoConfig - SEO 配置对象
 */
export function useSEO(seoConfig = {}) {
  const route = useRoute()
  const { locale } = useI18n()
  
  /**
   * 应用 SEO 配置
   */
  const applySEO = (config = {}) => {
    const configWithDefaults = {
      ...defaultSEO,
      ...config,
      url: config.url || (typeof window !== 'undefined' ? window.location.href : defaultSEO.url)
    }
    
    // 更新标题
    updateTitle(configWithDefaults.title)
    
    // 基础 meta 标签
    updateMetaTag('description', configWithDefaults.description)
    updateMetaTag('keywords', configWithDefaults.keywords)
    
    // Open Graph 标签
    updateMetaTag('og:title', configWithDefaults.title, 'property')
    updateMetaTag('og:description', configWithDefaults.description, 'property')
    updateMetaTag('og:image', configWithDefaults.image, 'property')
    updateMetaTag('og:url', configWithDefaults.url, 'property')
    updateMetaTag('og:type', configWithDefaults.type, 'property')
    updateMetaTag('og:locale', locale.value === 'zh' ? 'zh_CN' : 'en_US', 'property')
    
    // Twitter Card 标签
    updateMetaTag('twitter:card', 'summary_large_image')
    updateMetaTag('twitter:title', configWithDefaults.title)
    updateMetaTag('twitter:description', configWithDefaults.description)
    updateMetaTag('twitter:image', configWithDefaults.image)
    
    // Canonical URL
    updateLinkTag('canonical', configWithDefaults.url)
    
    // 结构化数据
    if (configWithDefaults.structuredData) {
      updateStructuredData(configWithDefaults.structuredData)
    }
  }
  
  // 监听路由变化，自动更新 SEO
  watch(
    () => [route.path, locale.value],
    () => {
      applySEO(seoConfig)
    },
    { immediate: true }
  )
  
  // 组件挂载时应用 SEO
  onMounted(() => {
    applySEO(seoConfig)
  })
  
  return {
    applySEO
  }
}

/**
 * 生成博客文章的结构化数据
 */
export function generateBlogStructuredData(article) {
  if (!article) return null
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt || article.title,
    image: article.image || defaultSEO.image,
    datePublished: article.published_at || article.date,
    dateModified: article.updated_at || article.published_at || article.date,
    author: {
      '@type': 'Person',
      name: 'GWorkspace'
    },
    publisher: {
      '@type': 'Organization',
      name: 'GWorkspace',
      logo: {
        '@type': 'ImageObject',
        url: typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : ''
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': typeof window !== 'undefined' ? window.location.href : ''
    }
  }
}

