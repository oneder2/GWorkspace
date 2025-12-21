# GitHub Actions 部署配置指南

本文档说明如何配置 GitHub Actions 实现前端自动部署到 Vercel，后端自动部署到自建服务器。

## 一、部署架构

```
GitHub Repository
    ├─→ Vercel GitHub 集成 (前端)
    │   └─→ 自动检测 push → 自动构建部署
    │
    ├─→ GitHub Actions (后端)
    │   └─→ 检测 backend/ 变更 → 部署到自建服务器
    │
    └─→ 自建服务器 (后端)
        └─→ Node.js + PM2 + SQLite
```

**注意**：前端通过 Vercel 的 GitHub 集成自动部署，无需在 GitHub Actions 中配置。

## 二、GitHub Secrets 配置

在 GitHub 仓库中设置以下 Secrets：

**注意**：前端通过 Vercel 的 GitHub 集成自动部署，无需配置 Vercel 相关的 Secrets。只需在 Vercel 项目设置中配置环境变量即可。

### 服务器相关（后端部署）

1. **SERVER_HOST**
   - 服务器 IP 地址或域名
   - 例如：`123.456.789.0` 或 `api.your-domain.com`

2. **SERVER_USER**
   - SSH 登录用户名
   - 例如：`root` 或 `deploy`

3. **SERVER_PORT**（可选）
   - SSH 端口，默认 22
   - 如果使用非标准端口，需要设置

4. **SSH_PRIVATE_KEY**
   - SSH 私钥内容
   - 获取方式：在本地生成 SSH 密钥对，将私钥内容添加到 Secrets

### 生成 SSH 密钥对

```bash
# 在本地生成 SSH 密钥对
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_deploy

# 查看公钥，添加到服务器的 ~/.ssh/authorized_keys
cat ~/.ssh/github_actions_deploy.pub

# 查看私钥，添加到 GitHub Secrets
cat ~/.ssh/github_actions_deploy
```

### 配置服务器 SSH 访问

```bash
# 在服务器上添加公钥
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "你的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## 三、服务器准备

### 1. 安装 Node.js

```bash
# 使用 NodeSource 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 安装 PM2

```bash
sudo npm install -g pm2

# 设置开机自启
pm2 startup
pm2 save
```

### 3. 创建部署目录

```bash
# 创建部署目录（使用用户主目录，无需 sudo）
mkdir -p ~/gworkspace/backend
mkdir -p ~/gworkspace/backups

# 如果需要使用系统目录（如 /var/www），需要预先创建并设置权限
# sudo mkdir -p /var/www/gworkspace/backend
# sudo mkdir -p /var/backups/gworkspace
# sudo chown -R $USER:$USER /var/www/gworkspace
# sudo chown -R $USER:$USER /var/backups/gworkspace
```

### 4. 配置环境变量

在服务器上创建 `.env` 文件：

```bash
cd ~/gworkspace/backend
nano .env
```

```env
# JWT 密钥（必须修改为强密码）
JWT_SECRET=your-very-secure-secret-key

# JWT 过期时间
JWT_EXPIRES_IN=7d

# 数据库路径
DATABASE_PATH=database/gworkspace.db

# 服务器端口
PORT=3001

# 环境模式
NODE_ENV=production
```

**重要**：首次部署后，将 `.env` 文件备份为 `.env.backup`，这样后续部署会自动恢复：

```bash
cp .env .env.backup
```

### 5. 初始化数据库

```bash
cd ~/gworkspace/backend
npm install
npm run migrate
npm run create-admin
```

## 四、Vercel 配置

### 1. 连接 GitHub 仓库

1. 登录 Vercel
2. 点击 "Add New Project"
3. 选择你的 GitHub 仓库
4. 配置项目设置：
   - **Framework Preset**: Vite（Vercel 会自动检测）
   - **Root Directory**: `./`（项目根目录）
   - **Build Command**: `npm run build`（自动检测）
   - **Output Directory**: `dist`（自动检测）
   - **Install Command**: `npm install`（自动检测）

### 2. 环境变量

在 Vercel 项目设置 → Environment Variables 中添加：

- `VITE_API_URL`: 后端 API 地址（例如：`https://api.your-domain.com/api`）

**重要**：配置完成后，Vercel 会自动监听 GitHub push 事件并自动部署，无需在 GitHub Actions 中配置。

## 五、工作流程说明

### 前端部署流程（Vercel 自动处理）

1. 推送到 `main` 分支
2. Vercel 自动检测到 push 事件
3. 自动构建前端（`npm run build`）
4. 自动部署到 Vercel 生产环境

**无需任何额外配置**，Vercel 的 GitHub 集成会自动处理所有步骤。

### 后端部署流程（GitHub Actions）

1. 检测到 `backend/` 目录变更时触发
2. 检出代码
3. 安装生产依赖
4. 创建部署包（排除 node_modules、.env、数据库文件）
5. 通过 SCP 上传到服务器
6. 在服务器上：
   - 备份当前版本和数据库
   - 停止服务
   - 解压新版本
   - 安装依赖
   - 运行数据库迁移
   - 启动服务

## 六、部署触发条件

### 自动触发

- **前端**：每次推送到 `main` 分支，Vercel 自动检测并部署
- **后端**：只有当 `backend/` 目录有变更时，GitHub Actions 才会部署

### 手动触发

- **前端**：在 Vercel Dashboard 可以手动触发重新部署
- **后端**：在 GitHub Actions 页面可以手动触发部署（`workflow_dispatch`）

## 七、故障排查

### 前端部署失败

1. **检查 Vercel 部署日志**
   - 登录 Vercel Dashboard
   - 查看项目的 Deployments 页面
   - 检查构建日志和错误信息

2. **检查环境变量**
   - 在 Vercel 项目设置中检查环境变量是否正确配置
   - 确保 `VITE_API_URL` 指向正确的后端地址

3. **检查构建配置**
   - 确认 Vercel 自动检测的框架设置正确（Vite）
   - 检查 `package.json` 中的构建脚本

### 后端部署失败

1. **SSH 连接问题**
   ```bash
   # 在本地测试 SSH 连接
   ssh -i ~/.ssh/github_actions_deploy user@your-server
   ```

2. **权限问题**
   ```bash
   # 检查目录权限
   ls -la ~/gworkspace/backend
   ```

3. **PM2 问题**
   ```bash
   # 在服务器上检查 PM2 状态
   pm2 status
   pm2 logs gworkspace-backend
   ```

4. **数据库迁移失败**
   ```bash
   # 手动运行迁移
   cd ~/gworkspace/backend
   npm run migrate
   ```

## 八、安全建议

1. **SSH 密钥安全**
   - 使用专用密钥对，不要使用个人密钥
   - 定期轮换密钥
   - 限制 SSH 密钥的权限

2. **环境变量安全**
   - 不要在代码中硬编码敏感信息
   - 使用 GitHub Secrets 管理所有密钥
   - 定期更新 JWT_SECRET

3. **服务器安全**
   - 使用防火墙限制端口访问
   - 定期更新系统和依赖
   - 监控服务器日志

4. **备份策略**
   - 自动备份在 `~/gworkspace/backups/`
   - 定期检查备份文件
   - 考虑异地备份

## 九、监控和维护

### 查看部署日志

```bash
# 在服务器上查看 PM2 日志
pm2 logs gworkspace-backend

# 查看最近的日志
pm2 logs gworkspace-backend --lines 100
```

### 回滚部署

如果新版本有问题，可以快速回滚：

```bash
cd ~/gworkspace/backend
pm2 stop gworkspace-backend

# 恢复备份
cd ~/gworkspace/backups
tar -xzf backend-backup-YYYYMMDD_HHMMSS.tar.gz -C ~/gworkspace/backend

# 恢复数据库
cp database/gworkspace_YYYYMMDD_HHMMSS.db ~/gworkspace/backend/database/gworkspace.db

# 重启服务
cd ~/gworkspace/backend
pm2 start src/server.js --name gworkspace-backend
```

## 十、总结

配置完成后，每次推送到 `main` 分支：
- 前端会自动部署到 Vercel
- 后端会自动部署到你的服务器（如果有变更）

所有部署过程都可以在 GitHub Actions 页面查看日志。

如有问题，请检查：
1. GitHub Secrets 是否正确配置
2. 服务器 SSH 访问是否正常
3. PM2 服务是否正常运行
4. 数据库迁移是否成功

