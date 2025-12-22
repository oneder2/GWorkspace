/**
 * 留言板用户关联迁移脚本
 * 为留言板表添加user_id字段，关联用户表
 */

-- 添加user_id字段（如果不存在）
-- SQLite不支持直接检查列是否存在，所以使用IF NOT EXISTS的方式
-- 如果列已存在，这个操作会被忽略（需要手动检查）

-- 先检查表结构，如果user_id列不存在则添加
-- 注意：SQLite不支持ALTER TABLE ADD COLUMN IF NOT EXISTS，需要手动处理
-- 这里提供一个安全的迁移方式

-- 添加user_id字段
-- 如果列已存在，会报错，但可以通过错误处理忽略
-- 在实际部署时，建议先检查列是否存在

-- 添加user_id列（关联users表）
-- 注意：如果列已存在，需要先删除再添加，或者使用PRAGMA table_info检查
ALTER TABLE guestbook ADD COLUMN user_id INTEGER REFERENCES users(id);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_guestbook_user_id ON guestbook(user_id);

