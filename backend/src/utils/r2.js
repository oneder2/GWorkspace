import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const accountId = (process.env.R2_ACCOUNT_ID || '').trim();
const accessKeyId = (process.env.R2_ACCESS_KEY_ID || '').trim();
const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim();
const bucketName = (process.env.R2_BUCKET_NAME || '').trim();

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  forcePathStyle: true,
});

export const uploadToR2 = async (fileBuffer, fileName, contentType) => {
  // 存储时的 Key 保持原始中文（SDK 会自动处理签名编码）
  // 这样在 R2 管理界面看到的名称是正常的
  const timestamp = Date.now();
  const key = `blog/${timestamp}-${fileName}`;
  
  // URL 编码的文件名，用于 Header 和返回 URL
  const encodedFileName = encodeURIComponent(fileName);
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    // 设置 Content-Disposition 确保下载名正常（使用 RFC 5987 标准）
    ContentDisposition: `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
  });

  try {
    await s3Client.send(command);
    
    const publicDomain = process.env.R2_PUBLIC_DOMAIN;
    if (publicDomain) {
      const domain = publicDomain.replace(/\/$/, '').replace(/^https?:\/\//, '');
      // 构造公开访问 URL 时，必须对路径中的中文部分进行编码
      return `https://${domain}/blog/${timestamp}-${encodedFileName}`;
    }
    
    // 如果没有配置公开域名，给出警告并返回 API URL（虽然可能无法直接显示）
    console.warn('[R2] R2_PUBLIC_DOMAIN is not set. Images may not render in browser.');
    return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
  } catch (error) {
    console.error('R2 upload error:', error);
    throw error;
  }
};

export default s3Client;
