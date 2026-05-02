import { marked } from 'marked'

const LOCAL_MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\(\.\/images\/([^\s)]+)(?:\s+(['"])(.*?)\3)?\)/g
const LOCAL_HTML_IMAGE_PATTERN = /<img\b([^>]*?)\bsrc=(['"])\.\/images\/([^'"]+)\2([^>]*)>/gi
const SIMPLE_STANDALONE_IMAGE_HTML_PATTERN = /^<img\b[\s\S]*?>$/i

const resolveLegacyImageUrl = (imageName, slug) => {
  if (!slug) {
    return `./images/${imageName}`
  }

  return `/src/posts/${slug}/images/${imageName}`
}

export const normalizeBlogImageSources = (content, { slug = '' } = {}) => {
  if (!content || typeof content !== 'string') {
    return ''
  }

  const normalizedSlug = typeof slug === 'string' ? slug.trim() : ''

  let normalizedContent = content.replace(
    LOCAL_MARKDOWN_IMAGE_PATTERN,
    (match, altText, imageName, quote, title) => {
      const resolvedUrl = resolveLegacyImageUrl(imageName, normalizedSlug)
      const titleSuffix = title ? ` ${quote}${title}${quote}` : ''
      return `![${altText}](${resolvedUrl}${titleSuffix})`
    }
  )

  normalizedContent = normalizedContent.replace(
    LOCAL_HTML_IMAGE_PATTERN,
    (match, beforeSrc, quote, imageName, afterSrc) => {
      const resolvedUrl = resolveLegacyImageUrl(imageName, normalizedSlug)
      return `<img${beforeSrc}src=${quote}${resolvedUrl}${quote}${afterSrc}>`
    }
  )

  return normalizedContent
}

export const isMarkdownImageParagraphToken = (token) => (
  token?.type === 'paragraph' &&
  Array.isArray(token.tokens) &&
  token.tokens.length === 1 &&
  token.tokens[0]?.type === 'image'
)

export const isSimpleStandaloneImageHtml = (value) => (
  typeof value === 'string' &&
  SIMPLE_STANDALONE_IMAGE_HTML_PATTERN.test(value.trim())
)

export const buildMarkdownPreviewBlocks = ({
  content,
  slug = '',
  renderer,
  markedOptions = {}
} = {}) => {
  const normalizedContent = normalizeBlogImageSources(content, { slug })
  if (!normalizedContent.trim()) {
    return []
  }

  const tokens = marked.lexer(normalizedContent, markedOptions)

  return tokens
    .filter(token => token.type !== 'space')
    .map((token, index) => {
      const rawSource = typeof token.raw === 'string' && token.raw.length > 0
        ? token.raw
        : (typeof token.text === 'string' ? token.text : `${token.type}-${index}`)
      const type = (
        isMarkdownImageParagraphToken(token) ||
        (token.type === 'html' && isSimpleStandaloneImageHtml(rawSource))
      ) ? 'image' : 'html'
      const html = marked.Parser.parse([token], {
        ...markedOptions,
        renderer
      })

      return {
        type,
        source: rawSource,
        signature: `${type}:${rawSource}`,
        html
      }
    })
}

export const reconcileMarkdownPreviewBlocks = ({
  previousBlocks = [],
  nextBlocks = [],
  createKey
} = {}) => {
  const keyQueues = new Map()

  previousBlocks.forEach(block => {
    if (!block?.signature || !block?.key) {
      return
    }

    if (!keyQueues.has(block.signature)) {
      keyQueues.set(block.signature, [])
    }

    keyQueues.get(block.signature).push(block.key)
  })

  return nextBlocks.map(block => {
    const reusableKeys = keyQueues.get(block.signature)
    const key = reusableKeys?.length
      ? reusableKeys.shift()
      : createKey()

    return {
      ...block,
      key
    }
  })
}
