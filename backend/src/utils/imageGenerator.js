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
const TEMPLATE_VERSION = 'v5'
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
  const density = Array.from(String(title || '')).reduce((score, char) => {
    if (/[\u4e00-\u9fff]/.test(char)) return score + 1.18
    if (/\s/.test(char)) return score + 0.34
    if (/[A-Z]/.test(char)) return score + 0.92
    return score + 0.78
  }, 0)

  if (density > 30) {
    return { fontSize: 40, width: 648, lineHeight: 1.12 }
  }

  if (density > 22) {
    return { fontSize: 44, width: 648, lineHeight: 1.1 }
  }

  if (density > 12) {
    return { fontSize: 48, width: 648, lineHeight: 1.08 }
  }

  return { fontSize: 52, width: 640, lineHeight: 1.06 }
}

function buildOgSvg({ safeTitle, safeGenre, safeExcerpt, displayDate }) {
  return `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ogBg" x1="80" y1="40" x2="1120" y2="590" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#f8fafc" />
          <stop offset="0.55" stop-color="#e2e8f0" />
          <stop offset="1" stop-color="#cbd5e1" />
        </linearGradient>
        <linearGradient id="ogAccent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0f172a" />
          <stop offset="1" stop-color="#334155" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" rx="36" fill="#e2e8f0" />
      <circle cx="1040" cy="120" r="220" fill="#94a3b8" opacity="0.18" />
      <circle cx="120" cy="560" r="160" fill="#cbd5e1" opacity="0.55" />
      <rect x="48" y="48" width="1104" height="534" rx="32" fill="url(#ogBg)" />
      <rect x="72" y="72" width="1056" height="486" rx="28" fill="url(#ogAccent)" opacity="0.94" />
      <rect x="104" y="108" width="140" height="42" rx="14" fill="#ffffff" opacity="0.12" />
      <text x="174" y="136" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="16" font-weight="700" fill="#e2e8f0" text-anchor="middle">${safeGenre}</text>
      <text x="104" y="186" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="18" fill="#cbd5e1">${displayDate || 'GWorkspace / Blog'}</text>
      <foreignObject x="104" y="214" width="690" height="220">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, PingFang SC, Microsoft YaHei, sans-serif; color: #f8fafc; font-size: 58px; font-weight: 800; line-height: 1.08; letter-spacing: -0.03em; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
          ${safeTitle}
        </div>
      </foreignObject>
      <foreignObject x="104" y="456" width="640" height="72">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, PingFang SC, Microsoft YaHei, sans-serif; color: #cbd5e1; font-size: 24px; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${safeExcerpt}
        </div>
      </foreignObject>
      <rect x="820" y="118" width="240" height="320" rx="28" fill="#f8fafc" />
      <rect x="852" y="150" width="176" height="176" rx="28" fill="#e2e8f0" />
      <text x="940" y="375" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="18" font-weight="700" fill="#0f172a" text-anchor="middle">GWorkspace</text>
      <text x="940" y="406" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="15" fill="#475569" text-anchor="middle">Personal notes, products, and experiments</text>
      <text x="104" y="546" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="24" font-weight="700" fill="#f8fafc" letter-spacing="0.12em">GWORKSPACE</text>
    </svg>
  `.trim()
}

function buildPosterSvg({ safeTitle, safeGenre, safeExcerpt, displayDate, qrSvg, posterTitleStyle }) {
  const qrViewBox = qrSvg?.viewBox || '0 0 320 320'
  const qrInnerMarkup = qrSvg?.innerMarkup || ''
  const { fontSize: titleFontSize, width: titleWidth, lineHeight: titleLineHeight } = posterTitleStyle

  return `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="posterBg" x1="40" y1="24" x2="1120" y2="606" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#0f172a" />
          <stop offset="0.52" stop-color="#1e293b" />
          <stop offset="1" stop-color="#334155" />
        </linearGradient>
        <linearGradient id="posterGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f97316" stop-opacity="0.42" />
          <stop offset="1" stop-color="#f59e0b" stop-opacity="0" />
        </linearGradient>
        <radialGradient id="posterCoolGlow" cx="0" cy="1" r="1">
          <stop offset="0" stop-color="#38bdf8" stop-opacity="0.28" />
          <stop offset="1" stop-color="#38bdf8" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="posterGlass" x1="72" y1="72" x2="1128" y2="558" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.14" />
          <stop offset="0.3" stop-color="#ffffff" stop-opacity="0.08" />
          <stop offset="1" stop-color="#0f172a" stop-opacity="0.28" />
        </linearGradient>
        <linearGradient id="posterPanel" x1="792" y1="92" x2="1112" y2="538" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.16" />
          <stop offset="1" stop-color="#0f172a" stop-opacity="0.26" />
        </linearGradient>
        <linearGradient id="posterDivider" x1="112" y1="0" x2="1060" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.16" />
          <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.04" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="posterVerticalDivider" x1="0" y1="132" x2="0" y2="500" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0" />
          <stop offset="0.18" stop-color="#ffffff" stop-opacity="0.08" />
          <stop offset="0.82" stop-color="#ffffff" stop-opacity="0.06" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
        <radialGradient id="posterQrGlow" cx="0.5" cy="0.4" r="0.76">
          <stop offset="0" stop-color="#f8fafc" stop-opacity="0.18" />
          <stop offset="0.5" stop-color="#60a5fa" stop-opacity="0.08" />
          <stop offset="1" stop-color="#60a5fa" stop-opacity="0" />
        </radialGradient>
        <filter id="posterShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="26" stdDeviation="28" flood-color="#020617" flood-opacity="0.32" />
        </filter>
        <filter id="posterSoftShadow" x="-15%" y="-15%" width="140%" height="160%">
          <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#020617" flood-opacity="0.24" />
        </filter>
      </defs>
      <rect width="1200" height="630" rx="36" fill="#020617" />
      <circle cx="1010" cy="120" r="260" fill="url(#posterGlow)" />
      <circle cx="180" cy="550" r="210" fill="url(#posterCoolGlow)" />
      <rect x="40" y="40" width="1120" height="550" rx="34" fill="url(#posterBg)" />
      <g filter="url(#posterShadow)">
        <rect x="72" y="72" width="1056" height="486" rx="34" fill="url(#posterGlass)" stroke="#ffffff" stroke-opacity="0.12" />
        <path d="M72 154C248 112 434 104 624 122C770 136 936 122 1128 92V72H72Z" fill="#ffffff" fill-opacity="0.045" />
        <rect x="88" y="88" width="1024" height="454" rx="28" fill="none" stroke="#ffffff" stroke-opacity="0.06" />
      </g>
      <rect x="112" y="112" width="156" height="42" rx="14" fill="#f8fafc" fill-opacity="0.11" stroke="#ffffff" stroke-opacity="0.08" />
      <text x="190" y="140" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="16" font-weight="700" fill="#e2e8f0" text-anchor="middle">${safeGenre}</text>
      <text x="112" y="188" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="18" fill="#cbd5e1">${displayDate || 'Read on GWorkspace'}</text>
      <foreignObject x="112" y="214" width="${titleWidth}" height="232">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, PingFang SC, Microsoft YaHei, sans-serif; color: #f8fafc; font-size: ${titleFontSize}px; font-weight: 800; line-height: ${titleLineHeight}; letter-spacing: -0.035em; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
          ${safeTitle}
        </div>
      </foreignObject>
      <rect x="112" y="428" width="148" height="2" rx="1" fill="url(#posterDivider)" />
      <foreignObject x="112" y="446" width="624" height="74">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, PingFang SC, Microsoft YaHei, sans-serif; color: #cbd5e1; font-size: 22px; line-height: 1.46; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${safeExcerpt}
        </div>
      </foreignObject>
      <text x="112" y="542" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="24" font-weight="700" fill="#f8fafc" letter-spacing="0.16em">GWORKSPACE</text>
      <text x="112" y="568" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="13" fill="#94a3b8" letter-spacing="0.08em">PERSONAL NOTES / PRODUCTS / EXPERIMENTS</text>
      <rect x="758" y="132" width="1.5" height="368" rx="0.75" fill="url(#posterVerticalDivider)" />
      <g filter="url(#posterShadow)">
        <rect x="786" y="92" width="320" height="446" rx="32" fill="url(#posterPanel)" stroke="#ffffff" stroke-opacity="0.14" />
      </g>
      <text x="946" y="134" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="22" font-weight="700" fill="#f8fafc" text-anchor="middle">分享海报</text>
      <text x="946" y="161" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="13" fill="#cbd5e1" text-anchor="middle">扫码阅读全文</text>
      <rect x="846" y="178" width="200" height="1.5" rx="0.75" fill="#ffffff" fill-opacity="0.07" />
      <ellipse cx="946" cy="328" rx="134" ry="134" fill="url(#posterQrGlow)" />
      <g filter="url(#posterSoftShadow)">
        <rect x="814" y="196" width="264" height="264" rx="38" fill="#f8fafc" fill-opacity="0.96" />
        <rect x="828" y="210" width="236" height="236" rx="30" fill="#ffffff" />
      </g>
      ${qrInnerMarkup ? `
      <svg x="838" y="220" width="216" height="216" viewBox="${qrViewBox}" xmlns="http://www.w3.org/2000/svg">
        ${qrInnerMarkup}
      </svg>
      ` : ''}
      <rect x="846" y="478" width="200" height="40" rx="20" fill="#ffffff" fill-opacity="0.075" stroke="#ffffff" stroke-opacity="0.06" />
      <text x="946" y="504" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="14" font-weight="700" fill="#f8fafc" text-anchor="middle">GWorkspace Blog</text>
    </svg>
  `.trim()
}
