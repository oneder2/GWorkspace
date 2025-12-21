# GWorkspace 部署指南

本文档详细说明如何将 GWorkspace 项目部署到生产环境。

## 目录

- [部署架构](#部署架构)
- [前置要求](#前置要求)
- [部署步骤](#部署步骤)
- [环境配置](#环境配置)
- [数据库初始化](#数据库初始化)
- [使用进程管理器](#使用进程管理器)
- [使用 Docker（可选）](#使用-docker可选)
- [使用 Nginx 反向代理](#使用-nginx-反向代理)
- [SSL/HTTPS 配置](#sslhttps-配置)
- [备份与恢复](#备份与恢复)
- [故障排查](#故障排查)

## 部署架构

GWorkspace 是一个全栈应用，包含：

- **前端**：Vue 3 + Vite 构建的静态文件
- **后端**：Node.js + Express API 服务器
- **数据库**：SQLite（文件数据库）

```
┌─────────────┐
│   Nginx     │  ← 反向代理服务器
│  (Port 80)  │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
┌──────▼──────┐  ┌───▼────────┐
│  前端静态   │  │ 后端API     │
│  文件      │  │ (Port 3001) │
│  (dist/)   │  └─────────────┘
└────────────┘         │
                  ┌────▼────┐
                  │ SQLite  │
                  │ 数据库   │
                  └─────────┘
```

## 前置要求

### 服务器要求

- **操作系统**：Linux（推荐 Ubuntu 20.04+ 或 CentOS 7+）
- **Node.js**：v18.0.0 或更高版本
- **Nginx**：1.18+（用于反向代理）
- **内存**：至少 512MB RAM
- **磁盘空间**：至少 1GB 可用空间

### 安装 Node.js

```bash
# 使用 NodeSource 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install nginx

# CentOS/RHEL
sudo yum install nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 部署步骤

### 1. 克隆项目

```bash
# 克隆项目到服务器
git clone <your-repo-url> /var/www/gworkspace
cd /var/www/gworkspace
```

### 2. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend
npm install
cd ..
```

### 3. 构建前端

```bash
# 构建生产版本
npm run build
```

构建产物将输出到 `dist/` 目录。

### 4. 配置环境变量

#### 后端环境变量

```bash
cd backend
cp .env.example .env
nano .env
```

编辑 `.env` 文件：

```env
# JWT 密钥（生产环境必须修改为强密码）
JWT_SECRET=your-very-secure-secret-key-change-this-in-production

# JWT 过期时间（默认7天）
JWT_EXPIRES_IN=7d

# 数据库路径（默认：database/gworkspace.db）
DATABASE_PATH=database/gworkspace.db

# 服务器端口（默认：3001）
PORT=3001

# 环境模式
NODE_ENV=production
```

**重要**：`JWT_SECRET` 必须是一个强随机字符串，可以使用以下命令生成：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 前端环境变量（可选）

如果需要自定义 API 地址：

```bash
cp .env.example .env
nano .env
```

```env
# API 服务器地址
VITE_API_URL=https://your-domain.com/api
```

### 5. 初始化数据库

```bash
# 运行数据库迁移
npm run migrate

# 创建管理员账户
cd backend
npm run create-admin
```

在 `backend/scripts/create-admin.js` 中修改管理员信息，然后运行：

```bash
npm run create-admin
```

### 6. 测试后端服务

```bash
cd backend
npm start
```

在浏览器访问 `http://your-server-ip:3001/api/health` 应该返回健康状态。

## 使用进程管理器

推荐使用 PM2 来管理 Node.js 进程，确保服务在后台运行并自动重启。

### 安装 PM2

```bash
sudo npm install -g pm2
```

### 启动后端服务

```bash
cd /var/www/gworkspace/backend
pm2 start src/server.js --name gworkspace-backend
```

### PM2 常用命令

```bash
# 查看运行状态
pm2 status

# 查看日志
pm2 logs gworkspace-backend

# 重启服务
pm2 restart gworkspace-backend

# 停止服务
pm2 stop gworkspace-backend

# 删除服务
pm2 delete gworkspace-backend

# 设置开机自启
pm2 startup
pm2 save
```

## 使用 Nginx 反向代理

### 配置 Nginx

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/gworkspace
```

配置内容：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 前端静态文件
    root /var/www/gworkspace/dist;
    index index.html;

    # 前端路由支持（SPA）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/gworkspace /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置
sudo systemctl reload nginx
```

### 设置文件权限

```bash
# 设置项目目录权限
sudo chown -R $USER:$USER /var/www/gworkspace
sudo chmod -R 755 /var/www/gworkspace

# 确保数据库目录可写
sudo chmod -R 755 /var/www/gworkspace/backend/database
```

## SSL/HTTPS 配置

使用 Let's Encrypt 免费 SSL 证书：

### 安装 Certbot

```bash
sudo apt-get install certbot python3-certbot-nginx
```

### 获取 SSL 证书

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot 会自动配置 Nginx 使用 HTTPS。

### 自动续期

Let's Encrypt 证书每 90 天需要续期，Certbot 会自动设置定时任务：

```bash
sudo certbot renew --dry-run
```

## 使用 Docker（可选）

### 创建 Dockerfile

**前端 Dockerfile** (`Dockerfile.frontend`):

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**后端 Dockerfile** (`backend/Dockerfile`):

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "src/server.js"]
```

### Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_PATH=database/gworkspace.db
    volumes:
      - ./backend/database:/app/database
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

运行：

```bash
docker-compose up -d
```

## 备份与恢复

### 备份数据库

```bash
# 创建备份脚本
cat > /var/www/gworkspace/backend/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/gworkspace"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp /var/www/gworkspace/backend/database/gworkspace.db $BACKUP_DIR/gworkspace_$DATE.db
# 保留最近30天的备份
find $BACKUP_DIR -name "gworkspace_*.db" -mtime +30 -delete
EOF

chmod +x /var/www/gworkspace/backend/scripts/backup.sh
```

### 设置自动备份

添加到 crontab：

```bash
crontab -e
```

添加：

```
0 2 * * * /var/www/gworkspace/backend/scripts/backup.sh
```

每天凌晨 2 点自动备份。

### 恢复数据库

```bash
# 停止服务
pm2 stop gworkspace-backend

# 恢复备份
cp /var/backups/gworkspace/gworkspace_YYYYMMDD_HHMMSS.db \
   /var/www/gworkspace/backend/database/gworkspace.db

# 启动服务
pm2 start gworkspace-backend
```

## 故障排查

### 检查后端服务

```bash
# 查看 PM2 日志
pm2 logs gworkspace-backend

# 检查端口占用
sudo netstat -tlnp | grep 3001

# 测试 API
curl http://localhost:3001/api/health
```

### 检查 Nginx

```bash
# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 测试 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 常见问题

1. **502 Bad Gateway**
   - 检查后端服务是否运行：`pm2 status`
   - 检查端口是否正确：`netstat -tlnp | grep 3001`

2. **404 Not Found（前端路由）**
   - 确保 Nginx 配置了 `try_files $uri $uri/ /index.html;`

3. **数据库权限错误**
   - 检查数据库文件权限：`ls -la backend/database/`
   - 确保目录可写：`chmod 755 backend/database`

4. **JWT 认证失败**
   - 检查 `JWT_SECRET` 环境变量是否正确设置
   - 确保前后端使用相同的配置

## 更新部署

当有新版本时：

```bash
# 1. 拉取最新代码
cd /var/www/gworkspace
git pull origin main

# 2. 安装新依赖
npm install
cd backend && npm install && cd ..

# 3. 重新构建前端
npm run build

# 4. 重启后端服务
pm2 restart gworkspace-backend

# 5. 重新加载 Nginx
sudo systemctl reload nginx
```

## 监控建议

- 使用 PM2 监控：`pm2 monit`
- 设置日志轮转：配置 `logrotate`
- 监控服务器资源：使用 `htop` 或 `top`
- 设置告警：使用监控工具（如 Prometheus + Grafana）

## 安全建议

1. **防火墙配置**
   ```bash
   sudo ufw allow 22/tcp  # SSH
   sudo ufw allow 80/tcp  # HTTP
   sudo ufw allow 443/tcp # HTTPS
   sudo ufw enable
   ```

2. **定期更新**
   ```bash
   sudo apt-get update && sudo apt-get upgrade
   ```

3. **使用强密码**
   - JWT_SECRET 使用随机字符串
   - 管理员密码使用强密码

4. **限制 API 访问**
   - 配置 `express-rate-limit`
   - 使用 CORS 限制来源

5. **定期备份**
   - 设置自动备份脚本
   - 测试备份恢复流程

## 总结

部署完成后，你的应用应该可以通过域名访问：

- 前端：`https://your-domain.com`
- API：`https://your-domain.com/api`

如有问题，请查看日志文件或联系技术支持。

