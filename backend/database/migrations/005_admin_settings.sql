/**
 * 管理员设置数据库迁移脚本
 * 创建管理员设置表，存储管理员位置、时区等信息
 * 使用单行表设计，始终只有一条记录
 */

-- 管理员设置表（单行表）
CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  location TEXT,                      -- 管理员位置，如 "Beijing, China"
  timezone TEXT,                      -- 时区，如 "Asia/Shanghai"
  ip_address TEXT,                    -- 最后登录IP地址
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,                 -- 更新者用户ID
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 插入默认记录（如果不存在）
INSERT OR IGNORE INTO admin_settings (id, location, timezone) 
VALUES (1, NULL, NULL);

