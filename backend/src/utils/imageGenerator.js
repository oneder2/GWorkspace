/**
 * 博客动态图片生成工具 (纯 SVG 零依赖版)
 * 优点：无需 C++ 编译，100% 环境兼容，极速响应
 */
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { formatPosterDate } from './blogDate.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CACHE_DIR = path.join(__dirname, '../../public/cache/og-images')
const TEMPLATE_VERSION = 'v6'
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

/**
 * 生成博客预览图 (纯 SVG)
 */
export async function generateBlogImage({ title, genre, excerpt = '', date, slug, updatedAt = '', url, isPoster = false }) {
  const safeSlug = (slug || 'blog')
    .replace(/[^\w\u4e00-\u9fff-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'blog'
  const cacheVersion = String(updatedAt || date || TEMPLATE_VERSION)
    .replace(/[^\w\u4e00-\u9fff-]+/g, '-')
    .replace(/-+/g, '-')
  const cacheKey = `${safeSlug}_${isPoster ? 'poster' : 'og'}_${TEMPLATE_VERSION}_${cacheVersion}.svg`
  const cachePath = path.join(CACHE_DIR, cacheKey)

  // 检查缓存
  if (fs.existsSync(cachePath)) {
    return { buffer: fs.readFileSync(cachePath), contentType: 'image/svg+xml' }
  }

  // 生成二维码 (如果是海报模式)
  let qrSvg = null
  if (isPoster && url) {
    const qrSvgString = await QRCode.toString(url, { 
      type: 'svg', 
      margin: 0, 
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#00000000'
      }
    })
    qrSvg = parseInlineSvg(qrSvgString)
  }

  const safeTitle = escapeHtml(title || 'Untitled Article')
  const safeGenre = escapeHtml((genre || 'Article').toUpperCase())
  const safeExcerpt = escapeHtml(excerpt || 'Scan the QR code to continue reading this article on GWorkspace.')
  const displayDate = escapeHtml(formatPosterDate(date))
  const posterTitleStyle = getPosterTitleStyle(title || '')
  const svgString = isPoster
    ? buildPosterSvg({ safeTitle, safeGenre, safeExcerpt, displayDate, qrSvg, posterTitleStyle })
    : buildOgSvg({ safeTitle, safeGenre, safeExcerpt, displayDate })

  const buffer = Buffer.from(svgString)
  fs.writeFileSync(cachePath, buffer)
  return { buffer, contentType: 'image/svg+xml' }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function parseInlineSvg(svgString) {
  const cleanedSvg = String(svgString || '').replace(/<\?xml[^>]*\?>/g, '').trim()
  const viewBoxMatch = cleanedSvg.match(/viewBox="([^"]+)"/i)
  const innerMarkup = cleanedSvg
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .trim()

  return {
    viewBox: (viewBoxMatch?.[1] || '0 0 320 320').replace(/[^\d.\s-]/g, ''),
    innerMarkup
  }
}

function getPosterTitleStyle(title) {
  const charCount = String(title || '').length
  const density = Array.from(String(title || '')).reduce((score, char) => {
    if (/[\u4e00-\u9fff]/.test(char)) return score + 1.18
    if (/\s/.test(char)) return score + 0.34
    if (/[A-Z]/.test(char)) return score + 0.92
    return score + 0.78
  }, 0)

  // 针对短标题增加字间距
  const letterSpacing = charCount < 8 ? '0.05em' : '-0.035em'

  if (density > 30) {
    return { fontSize: 40, width: 648, lineHeight: 1.12, letterSpacing }
  }

  if (density > 22) {
    return { fontSize: 44, width: 648, lineHeight: 1.1, letterSpacing }
  }

  if (density > 12) {
    return { fontSize: 48, width: 648, lineHeight: 1.08, letterSpacing }
  }

  return { fontSize: 56, width: 640, lineHeight: 1.05, letterSpacing: charCount < 5 ? '0.1em' : '0.02em' }
}

function buildOgSvg({ safeTitle, safeGenre, safeExcerpt, displayDate }) {
  return `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="ogNoise" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer><funcA type="linear" slope="0.03" /></feComponentTransfer>
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
        <linearGradient id="ogBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0f172a" />
          <stop offset="1" stop-color="#1e293b" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" rx="36" fill="url(#ogBg)" />
      <circle cx="1000" cy="100" r="300" fill="#38bdf8" opacity="0.15" filter="blur(80px)" />
      <circle cx="200" cy="500" r="250" fill="#f59e0b" opacity="0.1" filter="blur(80px)" />
      <rect width="1200" height="630" fill="white" filter="url(#ogNoise)" opacity="0.1" />
      
      <rect x="60" y="60" width="1080" height="510" rx="32" fill="white" fill-opacity="0.03" stroke="white" stroke-opacity="0.1" />
      
      <text x="100" y="130" font-family="Arial, PingFang SC, sans-serif" font-size="14" font-weight="800" fill="#94a3b8" letter-spacing="0.2em">${safeGenre}</text>
      <text x="100" y="170" font-family="Arial, PingFang SC, sans-serif" font-size="18" fill="#cbd5e1">${displayDate}</text>
      
      <foreignObject x="100" y="200" width="800" height="340">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, PingFang SC, sans-serif; display: flex; flex-direction: column; gap: 28px;">
          <div style="color: #f8fafc; font-size: 64px; font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
            ${safeTitle}
          </div>
          <div style="color: #94a3b8; font-size: 24px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; opacity: 0.9;">
            ${safeExcerpt}
          </div>
        </div>
      </foreignObject>
      
      <text x="100" y="560" font-family="Arial, PingFang SC, sans-serif" font-size="20" font-weight="800" fill="#f8fafc" letter-spacing="0.1em">GWORKSPACE</text>
    </svg>
  `.trim()
}

function buildPosterSvg({ safeTitle, safeGenre, safeExcerpt, displayDate, qrSvg, posterTitleStyle }) {
  const qrViewBox = qrSvg?.viewBox || '0 0 320 320'
  const qrInnerMarkup = qrSvg?.innerMarkup || ''
  const { fontSize: titleFontSize, width: titleWidth, lineHeight: titleLineHeight, letterSpacing: titleLetterSpacing } = posterTitleStyle

  return `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- 噪点滤镜 -->
        <filter id="noiseFilter" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer><funcA type="linear" slope="0.04" /></feComponentTransfer>
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
        
        <!-- 阴影 -->
        <filter id="panelShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="32" stdDeviation="36" flood-color="#020617" flood-opacity="0.45" />
        </filter>

        <!-- 背景渐变 -->
        <linearGradient id="mainBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0f172a" />
          <stop offset="1" stop-color="#1e293b" />
        </linearGradient>

        <!-- 玻璃面板渐变 -->
        <linearGradient id="glassFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.12" />
          <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.06" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0.02" />
        </linearGradient>

        <!-- 装饰光影 -->
        <radialGradient id="glowOrange" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#f59e0b" stop-opacity="0.25" />
          <stop offset="1" stop-color="#f59e0b" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="glowBlue" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#38bdf8" stop-opacity="0.2" />
          <stop offset="1" stop-color="#38bdf8" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="glowPurple" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#8b5cf6" stop-opacity="0.15" />
          <stop offset="1" stop-color="#8b5cf6" stop-opacity="0" />
        </radialGradient>

        <!-- 扫光动画模拟 -->
        <linearGradient id="sweepLight" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0" stop-color="white" stop-opacity="0" />
          <stop offset="0.2" stop-color="white" stop-opacity="0.08" />
          <stop offset="0.5" stop-color="white" stop-opacity="0.02" />
          <stop offset="1" stop-color="white" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- 底层背景 -->
      <rect width="1200" height="630" fill="url(#mainBg)" rx="36" />
      
      <!-- 氛围光晕 (Mesh Gradient Style) -->
      <circle cx="1100" cy="100" r="400" fill="url(#glowOrange)" />
      <circle cx="100" cy="550" r="350" fill="url(#glowBlue)" />
      <circle cx="900" cy="580" r="300" fill="url(#glowPurple)" />
      
      <!-- 噪点层 -->
      <rect width="1200" height="630" fill="white" filter="url(#noiseFilter)" opacity="0.15" />

      <!-- 背景大型水印 -->
      <text x="60" y="420" font-family="Arial, PingFang SC, sans-serif" font-size="180" font-weight="900" fill="white" fill-opacity="0.02" letter-spacing="-0.05em">GWORKSPACE</text>

      <!-- 玻璃主面板 -->
      <g filter="url(#panelShadow)">
        <rect x="60" y="60" width="1080" height="510" rx="40" fill="url(#glassFill)" stroke="white" stroke-opacity="0.15" stroke-width="1.5" />
        <!-- 面板顶部的微弱扫光 -->
        <path d="M60 160 Q 300 100, 600 120 T 1140 80 V 60 H 60 Z" fill="url(#sweepLight)" />
      </g>

      <!-- 内容区: 左侧 -->
      <g transform="translate(100, 110)">
        <!-- 分类标签 -->
        <rect width="80" height="30" rx="15" fill="#f8fafc" fill-opacity="0.12" stroke="white" stroke-opacity="0.2" />
        <text x="40" y="20" font-family="Arial, PingFang SC, sans-serif" font-size="12" font-weight="900" fill="#e2e8f0" text-anchor="middle" letter-spacing="0.1em">${safeGenre}</text>
        
        <!-- 日期 -->
        <text y="65" font-family="Arial, PingFang SC, sans-serif" font-size="18" font-weight="500" fill="#94a3b8" letter-spacing="0.05em">${displayDate}</text>
        
        <!-- 装饰线 -->
        <rect y="85" width="24" height="3" rx="1.5" fill="#f59e0b" fill-opacity="0.8" />

        <!-- 标题 + 摘要 混合排版区 -->
        <foreignObject y="105" width="${titleWidth}" height="300">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, PingFang SC, sans-serif; display: flex; flex-direction: column; gap: 20px;">
            <div style="color: #f8fafc; font-size: ${titleFontSize}px; font-weight: 800; line-height: ${titleLineHeight}; letter-spacing: ${titleLetterSpacing}; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">
              ${safeTitle}
            </div>
            <div style="color: #cbd5e1; font-size: 20px; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; opacity: 0.85;">
              ${safeExcerpt}
            </div>
          </div>
        </foreignObject>

        <!-- 底部标识 (固定在安全区域) -->
        <g transform="translate(0, 412)">
          <text font-family="Arial, PingFang SC, sans-serif" font-size="22" font-weight="900" fill="#f8fafc" letter-spacing="0.15em">GWORKSPACE</text>
          <text y="22" font-family="Arial, PingFang SC, sans-serif" font-size="11" font-weight="700" fill="#64748b" letter-spacing="0.08em">PERSONAL NOTES / PRODUCTS / EXPERIMENTS</text>
        </g>
      </g>

      <!-- 内容区: 右侧二维码卡片 -->
      <g transform="translate(780, 100)">
        <!-- 二维码磨砂容器 -->
        <rect width="320" height="430" rx="32" fill="white" fill-opacity="0.05" stroke="white" stroke-opacity="0.1" stroke-width="1" />
        <text x="160" y="45" font-family="Arial, PingFang SC, sans-serif" font-size="20" font-weight="800" fill="#f8fafc" text-anchor="middle">分享海报</text>
        <text x="160" y="72" font-family="Arial, PingFang SC, sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle" opacity="0.8">扫码阅读全文</text>
        
        <!-- 二维码白座 -->
        <rect x="25" y="105" width="270" height="270" rx="36" fill="#f8fafc" fill-opacity="0.92" />
        <g transform="translate(40, 120)">
          ${qrInnerMarkup ? `
          <svg width="240" height="240" viewBox="${qrViewBox}" xmlns="http://www.w3.org/2000/svg">
            ${qrInnerMarkup}
          </svg>
          ` : ''}
        </g>

        <!-- 底部药丸按钮 -->
        <rect x="60" y="388" width="200" height="32" rx="16" fill="white" fill-opacity="0.08" stroke="white" stroke-opacity="0.1" />
        <text x="160" y="409" font-family="Arial, PingFang SC, sans-serif" font-size="13" font-weight="700" fill="#cbd5e1" text-anchor="middle">GWorkspace Blog</text>
      </g>
    </svg>
  `.trim()
}

