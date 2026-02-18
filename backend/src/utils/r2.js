import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 初始化 Cloudflare R2 客户端
 * R2 是 S3 兼容的，使用 S3 客户端即可
 */
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * 上传文件到 R2
 * @param {Buffer} fileBuffer - 文件二进制数据
 * @param {string} fileName - 原始文件名
 * @param {string} contentType - 文件 MIME 类型
 * @returns {Promise<string>} 返回可访问的 URL
 */
export const uploadToR2 = async (fileBuffer, fileName, contentType) => {
  const key = `blog/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });

  try {
    await s3Client.send(command);
    
    // 如果配置了自定义域名，使用自定义域名；否则使用 R2 默认公共 URL 结构
    const publicDomain = process.env.R2_PUBLIC_DOMAIN;
    if (publicDomain) {
      return `${publicDomain.startsWith('http') ? '' : 'https://'}${publicDomain}/${key}`;
    }
    
    // 注意：R2 默认不直接暴露 bucket.r2.dev 的 URL，通常建议绑定一个 Cloudflare 域名
    return `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
  } catch (error) {
    console.error('R2 upload error:', error);
    throw error;
  }
};

export default s3Client;
