/**
 * 迁移脚本：添加用户收藏站点字段
 */

-- 为用户表添加收藏站点字段（存储JSON字符串）
ALTER TABLE users ADD COLUMN site_favorites TEXT;
