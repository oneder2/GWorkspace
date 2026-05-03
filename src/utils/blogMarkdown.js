import { marked } from 'marked'

const SIMPLE_STANDALONE_IMAGE_HTML_PATTERN = /^<img\b[\s\S]*?>$/i

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
  renderer,
  markedOptions = {}
} = {}) => {
  const normalizedContent = typeof content === 'string' ? content : ''
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
