/**
 * 博客动态图片生成工具
 * 功能：根据文章信息生成 OG Image 或 分享海报
 */
import { createCanvas, registerFont, loadImage } from 'canvas';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 缓存目录配置
const CACHE_DIR = path.join(__dirname, '../../public/cache/og-images');

// 确保目录存在
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * 绘制圆角矩形
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * 自动文本换行
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split('');
  let line = '';
  let lines = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n];
      y += lineHeight;
      lines++;
      // 限制最多显示 3 行
      if (lines >= 2) {
        ctx.fillText(line + '...', x, y);
        return;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

/**
 * 生成博客预览图
 * @param {Object} options - 配置项
 * @param {string} options.title - 文章标题
 * @param {string} options.genre - 文章分类
 * @param {string} options.date - 发布日期
 * @param {string} options.slug - 文章 slug (用于文件名缓存)
 * @param {string} options.url - 文章完整 URL (用于二维码)
 * @param {boolean} options.isPoster - 是否为海报模式 (带二维码)
 */
export async function generateBlogImage({ title, genre, date, slug, url, isPoster = false }) {
  const cacheKey = `${slug}${isPoster ? '_poster' : '_og'}.png`;
  const cachePath = path.join(CACHE_DIR, cacheKey);

  // 检查缓存
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath);
  }

  // 画布尺寸 (OG 标准比例 1.91:1)
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 1. 绘制背景渐变
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1e293b'); // slate-800
  gradient.addColorStop(1, '#0f172a'); // slate-900
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 2. 绘制装饰性光圈 (玻璃拟态感)
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.arc(width * 0.8, height * 0.2, 300, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(width * 0.1, height * 0.8, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // 3. 绘制卡片容器
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  drawRoundedRect(ctx, 60, 60, width - 120, height - 120, 32);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 4. 绘制分类标签
  if (genre) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    drawRoundedRect(ctx, 100, 110, 140, 40, 8);
    ctx.fill();
    
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(genre.toUpperCase(), 170, 138);
  }

  // 5. 绘制日期
  ctx.font = '20px monospace';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'left';
  ctx.fillText(date, 100, 190);

  // 6. 绘制标题 (自动换行)
  ctx.font = 'bold 72px sans-serif';
  ctx.fillStyle = '#f1f5f9';
  ctx.textAlign = 'left';
  wrapText(ctx, title, 100, 280, width - 250, 90);

  // 7. 绘制站点标识
  ctx.font = 'bold 32px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('GWORKSPACE', 100, height - 110);

  // 8. 绘制二维码 (仅海报模式)
  if (isPoster && url) {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        margin: 1,
        width: 160,
        color: {
          dark: '#f1f5f9',
          light: '#1e293b'
        }
      });
      const qrImage = await loadImage(qrDataUrl);
      
      // 绘制二维码容器
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      drawRoundedRect(ctx, width - 280, height - 280, 180, 180, 16);
      ctx.fill();
      
      // 绘制二维码
      ctx.drawImage(qrImage, width - 270, height - 270, 160, 160);
      
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('扫码阅读全文', width - 190, height - 85);
    } catch (err) {
      console.error('QR Code generation failed:', err);
    }
  }

  // 保存缓存并返回
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(cachePath, buffer);
  return buffer;
}
