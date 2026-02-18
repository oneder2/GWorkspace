import express from 'express';
import multer from 'multer';
import { uploadToR2 } from '../utils/r2.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// 配置Multer内存存储
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
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

    // 检查核心环境变量是否配置
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID) {
      return res.status(500).json({ error: 'Cloudflare R2 is not configured' });
    }

    const url = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
    
    res.json({
      url: url,
      name: req.file.originalname
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image', details: error.message });
  }
});

export default router;
