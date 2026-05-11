import express from 'express';
import multer from 'multer';
import { getMissingR2Fields, uploadToR2 } from '../utils/r2.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// 配置Multer内存存储
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 限制20MB
  }
});

/**
 * 上传博客图片
 * POST /api/upload/blog-image
 * 仅管理员可上传到 Cloudflare R2
 */
router.post('/blog-image', authenticate, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // 修复 Multer 中文文件名乱码问题：从 Latin1 转回 UTF-8
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    
    console.log(`[Upload] Attempting to upload ${originalName} (${req.file.size} bytes)`);

    // 检查核心环境变量是否配置
    const missingKeys = getMissingR2Fields()

    if (missingKeys.length > 0) {
      console.error('[Upload] R2 Configuration Missing:', missingKeys.join(', '));
      return res.status(500).json({ 
        error: 'Cloudflare R2 is not fully configured', 
        missingFields: missingKeys 
      });
    }

    const result = await uploadToR2(req.file.buffer, originalName, req.file.mimetype);
    
    console.log(`[Upload] Success: ${result.url}`);
    res.json({
      url: result.url,
      key: result.key,
      name: originalName,
      cacheControl: result.cache_control
    });
  } catch (error) {
    console.error('[Upload] Server error during image processing:', error);
    res.status(500).json({ 
      error: 'Failed to upload image', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
