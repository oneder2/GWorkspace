# 服务器配置指南

本文档说明项目部署到服务器时需要单独配置的文件和环境变量。

## 📋 配置清单

### 必须配置的文件

这些文件**不应**提交到 Git 仓库，需要在服务器上单独创建：

1. **后端环境变量** - `backend/.env`
2. **敏感词库** - `backend/src/utils/sensitiveWords.json`

### 可选配置的文件

3. **前端环境变量** - `.env`（仅在本地开发或自定义API地址时需要）

---

## 🔧 配置步骤

### 1. 后端环境变量配置

**文件位置**: `backend/.env`

**创建步骤**:
```bash
cd backend
cp .env.example .env
nano .env  # 或使用你喜欢的编辑器
```

**必需配置项**:

| 变量名 | 说明 | 示例值 | 是否必需 |
|--------|------|--------|----------|
| `JWT_SECRET` | JWT 密钥，用于用户认证 | 强随机字符串 | ✅ **是** |
| `JWT_EXPIRES_IN` | Token 过期时间 | `7d` | ❌ 否（默认7天） |
| `DATABASE_PATH` | 数据库文件路径 | `database/gworkspace.db` | ❌ 否（默认路径） |
| `PORT` | 服务器端口 | `3001` | ❌ 否（默认3001） |
| `NODE_ENV` | 环境模式 | `production` | ❌ 否 |
| `ALLOWED_ORIGINS` | CORS允许的源 | `https://yourdomain.com,https://www.yourdomain.com` | ❌ 否（生产环境有默认值） |

**生成 JWT_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**示例配置**:
```env
JWT_SECRET=your-very-secure-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
DATABASE_PATH=database/gworkspace.db
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

### 2. 敏感词库配置

**文件位置**: `backend/src/utils/sensitiveWords.json`

**创建步骤**:
```bash
cd backend/src/utils
cp sensitiveWords.json.example sensitiveWords.json
nano sensitiveWords.json  # 或使用你喜欢的编辑器
```

**文件结构**:
```json
{
  "words": [
    "spam",
    "advertisement",
    "你的敏感词1",
    "你的敏感词2"
  ],
  "notes": "敏感词库 - 每行一个词，支持中英文。添加新词后需要重启服务器。",
  "updated_at": "2025-01-01T00:00:00.000Z"
}
```

**说明**:
- 支持中英文敏感词
- 添加新词后需要重启服务器才能生效
- 详细管理方法请参考 [敏感词库管理指南](./SENSITIVE_WORDS_GUIDE.md)

---

### 3. 前端环境变量配置（可选）

**文件位置**: `.env`（项目根目录）

**创建步骤**:
```bash
cp .env.example .env
nano .env  # 或使用你喜欢的编辑器
```

**配置项**:

| 变量名 | 说明 | 示例值 | 是否必需 |
|--------|------|--------|----------|
| `VITE_API_URL` | API 服务器地址 | `https://api.yourdomain.com/api` | ❌ 否（开发环境有默认值） |

**说明**:
- 如果使用 Vercel 部署，应在 Vercel 项目设置中配置环境变量，而不是使用 `.env` 文件
- 本地开发环境默认使用 `http://localhost:3001/api`

---

## 📝 GitHub Actions 自动部署说明

使用 GitHub Actions 自动部署时，需要注意：

### 后端部署

1. **`.env` 文件不会被部署**
   - GitHub Actions 在创建部署包时会排除 `.env` 文件
   - 首次部署后，在服务器上手动创建 `.env` 文件
   - 建议将 `.env` 备份为 `.env.backup`，后续部署会自动恢复

2. **敏感词库文件不会被部署**
   - `sensitiveWords.json` 文件在 `.gitignore` 中，不会被提交到 Git
   - 首次部署后，在服务器上从 `sensitiveWords.json.example` 创建

3. **数据库文件不会被部署**
   - 数据库文件（`*.db`, `*.db-wal`, `*.db-shm`）会在服务器上创建
   - 首次部署会自动运行数据库迁移

### 首次部署后配置步骤

```bash
# 1. 进入部署目录
cd ~/gworkspace/backend

# 2. 创建环境变量文件
cp .env.example .env
nano .env  # 编辑并配置 JWT_SECRET 等

# 3. 备份 .env 文件（重要！）
cp .env .env.backup

# 4. 创建敏感词库文件
cp src/utils/sensitiveWords.json.example src/utils/sensitiveWords.json
nano src/utils/sensitiveWords.json  # 根据需要编辑

# 5. 重启服务
pm2 restart gworkspace-backend
```

---

## 🔒 安全注意事项

1. **永远不要提交以下文件到 Git**:
   - `backend/.env`
   - `backend/.env.backup`
   - `backend/src/utils/sensitiveWords.json`
   - `backend/database/*.db` 及其相关文件
   - `.env`（前端，如果存在）

2. **JWT_SECRET 必须是强随机字符串**
   - 不要使用默认值或弱密码
   - 使用 `crypto.randomBytes()` 生成

3. **定期备份配置文件**
   - 备份 `.env` 文件（但不要提交到 Git）
   - 使用安全的方式存储备份（如加密存储）

4. **敏感词库管理**
   - 敏感词库可能包含业务敏感信息
   - 定期审查和更新敏感词库

---

## 📚 相关文档

- [部署文档](./DEPLOYMENT.md) - 完整的部署流程
- [GitHub Actions 配置指南](./GITHUB_ACTIONS_SETUP.md) - 自动部署配置
- [敏感词库管理指南](./SENSITIVE_WORDS_GUIDE.md) - 敏感词库详细管理方法

---

## ❓ 常见问题

### Q: 为什么 `.env` 文件不在 Git 中？

A: `.env` 文件包含敏感信息（如 JWT_SECRET），提交到 Git 会泄露这些信息。每个环境（开发、生产）应该有自己独立的 `.env` 文件。

### Q: 如何在不同环境使用不同的配置？

A: 在不同服务器或环境中分别创建 `.env` 文件，配置相应的值即可。使用 `NODE_ENV` 环境变量区分开发和生产环境。

### Q: 部署后忘记配置 `.env` 会怎样？

A: 应用会使用代码中的默认值，但默认的 `JWT_SECRET` 是不安全的，必须修改。建议在部署脚本中添加检查。

### Q: 如何更新敏感词库而不重启服务器？

A: 目前不支持热更新，修改后需要重启服务器。可以使用 `pm2 restart gworkspace-backend` 重启服务。

---

**最后更新**: 2025-01-22

