/**
 * 博客动态图片生成工具 (纯 SVG 零依赖版)
 * 优点：无需 C++ 编译，100% 环境兼容，极速响应
 */
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, '../../public/cache/og-images');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * 生成博客预览图 (纯 SVG)
 */
export async function generateBlogImage({ title, genre, date, slug, url, isPoster = false }) {
  const cacheKey = `${slug}${isPoster ? '_poster' : '_og'}.svg`;
  const cachePath = path.join(CACHE_DIR, cacheKey);

  // 检查缓存
  if (fs.existsSync(cachePath)) {
    return { buffer: fs.readFileSync(cachePath), contentType: 'image/svg+xml' };
  }

  // 生成二维码 (如果是海报模式)
  let qrSvg = '';
  if (isPoster && url) {
    // 生成无背景、路径化的二维码 SVG 片段
    qrSvg = await QRCode.toString(url, { 
      type: 'svg', 
      margin: 0, 
      width: 140,
      color: {
        dark: '#f1f5f9',
        light: '#00000000' // 透明背景
      }
    });
    // 移除 SVG 头部声明，只保留内部路径
    qrSvg = qrSvg.replace(/<\?xml[^>]*\?>/g, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
  }

  // 构建 SVG 模板 (完全套用站点的深色玻璃拟态视觉)
  const svgString = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#1e293b"/>
          <stop offset="1" stop-color="#0f172a"/>
        </linearGradient>
        <clipPath id="clip">
          <rect width="1200" height="630" rx="40" />
        </clipPath>
      </defs>
      
      <!-- 主背景 -->
      <rect width="1200" height="630" fill="url(#bgGrad)"/>
      
      <!-- 装饰光圈 -->
      <circle cx="1000" cy="100" r="350" fill="#475569" opacity="0.2" />
      <circle cx="150" cy="500" r="200" fill="#334155" opacity="0.15" />
      
      <!-- 玻璃卡片主体 -->
      <rect x="60" y="60" width="1080" height="510" rx="32" fill="white" fill-opacity="0.03" stroke="white" stroke-opacity="0.1" stroke-width="2"/>
      
      <!-- 分类标签 -->
      <g transform="translate(100, 110)">
        <rect width="120" height="36" rx="8" fill="white" fill-opacity="0.1" />
        <text x="60" y="25" font-family="sans-serif" font-size="16" font-weight="bold" fill="#94a3b8" text-anchor="middle" letter-spacing="1">
          ${(genre || 'TECH').toUpperCase()}
        </text>
      </g>
      
      <!-- 日期 -->
      <text x="100" y="190" font-family="monospace" font-size="20" fill="#64748b">${date || ''}</text>
      
      <!-- 标题 (支持自动换行) -->
      <foreignObject x="100" y="230" width="850" height="300">
        <div xmlns="http://www.w3.org/1900/xhtml" style="color: #f1f5f9; font-family: sans-serif; font-size: 72px; font-weight: 800; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
          ${title}
        </div>
      </foreignObject>

      <!-- 品牌 -->
      <text x="100" y="525" font-family="sans-serif" font-size="32" font-weight="bold" fill="#475569" letter-spacing="2">GWORKSPACE</text>
      
      <!-- 二维码区域 (仅海报模式) -->
      ${isPoster ? `
        <g transform="translate(930, 380)">
          <rect width="170" height="170" rx="16" fill="white" fill-opacity="0.05" />
          <g transform="translate(15, 15)">
            ${qrSvg}
          </g>
          <text x="85" y="195" font-family="sans-serif" font-size="14" fill="#64748b" text-anchor="middle">扫码阅读全文</text>
        </g>
      ` : ''}
    </svg>
  `.trim();

  const buffer = Buffer.from(svgString);
  fs.writeFileSync(cachePath, buffer);
  return { buffer, contentType: 'image/svg+xml' };
}
