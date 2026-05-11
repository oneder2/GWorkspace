# GWorkspace

一个基于 Vue.js 的个人工作空间静态网站，采用 Glassmorphism（玻璃态）设计风格，支持暗色模式和中英双语切换。

当前版本：`v3.1.0`

该项目受到 YYsuni 的启发：https://github.com/YYsuni/2025-blog-public/tree/main

## v3.1.0 摘要

- **首页重心变化**：相较 `v3.0.0` 以工具工作台定版为主的阶段，`v3.1.0` 将首页调整为更个人化的欢迎层，围绕问候、近况、Slogan、手边事情与音乐状态组织内容。
- **维护方式变化**：首页的稳定信息改为后台低频维护，Spotify 正在听改为后端实时拉取，形成“静态信息手动维护 + 动态状态自动更新”的分工。
- **后台能力补强**：管理员系统页新增系统操作和 Spotify 状态检查能力，可以直接查看配置缺失、回调地址和令牌缓存状态。
- **体验细节收口**：首页文案、搜索栏层级、卡片边界、亮暗色文本对比和单页响应式展示都完成了一轮细化。

## 功能特性

### 核心功能

- **现代化设计**：采用 Glassmorphism 玻璃态设计风格，视觉效果优雅
- **暗色模式**：支持亮色/暗色主题切换，自动保存用户偏好
- **国际化支持**：完整的中英双语支持，可轻松扩展其他语言
- **实时天气**：根据访问者 IP 地址自动获取当地天气信息
- **多搜索引擎**：支持 Google 和 DuckDuckGo 搜索
- **响应式设计**：完美适配桌面端和移动端设备

### 功能模块

#### 首页 (Home)
- 个性化欢迎文案与站点介绍
- 近况、Slogan、手边事情卡片
- Spotify 正在听卡片
- 多搜索引擎切换（Google / DuckDuckGo）
- 快捷链接导航
- 实时时间显示

#### 站点导航 (Sites)
- 分类展示常用网站链接
- 实时搜索筛选功能
- 右侧目录索引
- 友站链接：专门的友站链接分区，展示友情站点
- 模块化设计，便于添加新分类和链接

#### 工具箱 (Tools)
- 计算器：基础数学计算功能
- 编码转换：Base64 和 URL 编码/解码
- JSON 格式化：JSON 格式化和压缩工具
- 模块化设计，便于添加新工具

#### 博客 (Blog)
- 文章列表展示，仿照参考网站样式优化显示
- 详细信息展示：发布日期（中文格式）、观看数、点赞数、评论数、热度（℃）
- 标签和归档功能
- 后端API：基于 Express + SQLite 的全栈架构
- 数据持久化：博客文章、点赞、评论、访问统计
- 用户系统：支持用户注册/登录，点赞和评论功能
- 管理后台：管理员可以管理博客、查看统计数据、审核评论
- 首页内容维护：支持低频编辑首页近况、Slogan 与手边事情
- 系统运维面板：支持查看备份、对象存储资源与 Spotify 配置状态
- 模块化设计，易于扩展

#### 作品集 (Portfolio)
- 项目展示卡片
- 标签分类
- 模块化设计，便于添加新作品

## 技术栈

### 前端
- **框架**：Vue 3 (Composition API)
- **构建工具**：Vite
- **样式**：Tailwind CSS
- **国际化**：Vue I18n
- **图标**：自定义 SVG 图标组件（不使用 emoji）

### 后端
- **框架**：Express.js
- **数据库**：SQLite (better-sqlite3)
- **ORM**：原生 SQL（使用 better-sqlite3）
- **API**：RESTful API
- **认证**：JWT Token 认证
- **安全**：bcrypt 密码加密、Helmet 安全头、CORS 配置

## 项目结构

```
GWorkspace/
├── src/                    # 前端源码
│   ├── components/        # 组件目录
│   │   ├── icons/         # SVG 图标组件
│   │   ├── tools/         # 工具箱子组件
│   │   ├── Header.vue      # 顶部状态栏
│   │   ├── Sidebar.vue    # 侧边栏导航
│   │   ├── AuthModal.vue  # 登录/注册弹窗
│   │   └── BlogEditor.vue # 博客编辑器
│   ├── pages/             # 页面组件
│   │   ├── HomePage.vue
│   │   ├── SitesPage.vue
│   │   ├── ToolsPage.vue
│   │   ├── BlogPage.vue
│   │   ├── BlogDetailPage.vue
│   │   └── admin/         # 管理后台页面
│   │       ├── AdminLayout.vue
│   │       ├── AdminDashboard.vue
│   │       ├── AdminBlogList.vue
│   │       ├── AdminBlogEditor.vue
│   │       ├── AdminAnalytics.vue
│   │       └── AdminComments.vue
│   ├── composables/       # 组合式函数
│   │   └── useAuth.js     # 用户认证组合式函数
│   ├── i18n/              # 国际化配置
│   ├── utils/             # 工具函数
│   │   └── api.js         # API客户端
│   ├── App.vue            # 根组件
│   └── main.js            # 入口文件
├── backend/                # 后端源码
│   ├── src/
│   │   ├── config/        # 配置文件
│   │   │   └── database.js # 数据库配置
│   │   ├── models/         # 数据模型
│   │   │   ├── Blog.js
│   │   │   ├── Comment.js
│   │   │   ├── Like.js
│   │   │   ├── Visit.js
│   │   │   └── User.js
│   │   ├── routes/         # API路由
│   │   │   ├── blog.js
│   │   │   ├── comments.js
│   │   │   ├── likes.js
│   │   │   ├── analytics.js
│   │   │   ├── auth.js
│   │   │   └── admin.js
│   │   ├── middleware/      # 中间件
│   │   │   └── auth.js      # 认证中间件
│   │   └── server.js       # 服务器入口
│   ├── database/
│   │   ├── migrations/     # 数据库迁移
│   │   └── gworkspace.db   # SQLite数据库
│   └── scripts/
│       └── migrate-from-files.js  # 数据迁移脚本
├── index.html             # HTML 模板
├── package.json           # 前端项目配置
├── vite.config.js         # Vite 配置
└── README.md              # 项目文档
```

## 快速开始

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend
npm install
cd ..
```

### 启动开发服务器

#### 方式一：分别启动前后端

```bash
# 终端1：启动前端（端口3000）
npm run dev

# 终端2：启动后端（端口3001）
npm run dev:backend
```

#### 方式二：同时启动前后端（需要安装 concurrently）

```bash
npm install -D concurrently
npm run dev:all
```

前端开发服务器将在 `http://localhost:3000` 启动，后端API服务器将在 `http://localhost:3001` 启动。

### 初始化数据库

```bash
# 运行数据库迁移
npm run migrate

# 创建管理员账户
cd backend
npm run create-admin
cd ..
```

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

## 文档

- [开发指南](./DEVELOPMENT.md) - 开发环境配置、项目架构、扩展指南
- [用户使用指南](./docs/USER_GUIDE.md) - 详细的功能使用说明
- [部署文档](./docs/DEPLOYMENT.md) - 生产环境部署指南
- [样式系统](./docs/STYLE_SYSTEM.md) - 设计系统、样式规范
- [服务器配置](./docs/SERVER_CONFIG.md) - 环境变量、服务器配置
- [更新日志](./CHANGELOG.md) - 版本更新记录

## 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。
