# GWorkspace

一个基于 Vue.js 的个人工作空间静态网站，采用 Glassmorphism（玻璃态）设计风格，支持暗色模式和中英双语切换。

该项目受到YYsuni大佬的启发：https://github.com/YYsuni/2025-blog-public/tree/main，学到了很多东西，包括单篇博客资源管理和全栈架构设计，十分感谢！

## 功能特性

### ✨ 核心功能

- **🎨 现代化设计**：采用 Glassmorphism 玻璃态设计风格，视觉效果优雅
- **🌓 暗色模式**：支持亮色/暗色主题切换，自动保存用户偏好
- **🌍 国际化支持**：完整的中英双语支持，可轻松扩展其他语言
- **🌤️ 实时天气**：根据访问者 IP 地址自动获取当地天气信息
- **🔍 多搜索引擎**：支持 Google 和 DuckDuckGo 搜索
- **📱 响应式设计**：完美适配桌面端和移动端设备

### 🛠️ 功能模块

#### 1. 首页 (Home)
- 多搜索引擎切换（Google / DuckDuckGo）
- 快捷链接导航
- 实时时间显示

#### 2. 站点导航 (Sites)
- 分类展示常用网站链接
- 实时搜索筛选功能
- 右侧目录索引
- 模块化设计，便于添加新分类和链接

#### 3. 工具箱 (Tools)
- **计算器**：基础数学计算功能
- **编码转换**：Base64 和 URL 编码/解码
- **JSON 格式化**：JSON 格式化和压缩工具
- 模块化设计，便于添加新工具

#### 4. 博客 (Blog)
- 文章列表展示
- 标签和归档功能
- **后端API**：基于 Express + SQLite 的全栈架构
- **数据持久化**：博客文章、点赞、评论、访问统计
- **用户系统**：支持用户注册/登录，点赞和评论功能
- **管理后台**：管理员可以管理博客、查看统计数据、审核评论
- 模块化设计，易于扩展

#### 5. 作品集 (Portfolio)
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
npm install
```

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

### 数据迁移

如果已有文件系统的博客文章，需要迁移到数据库：

```bash
npm run migrate
```

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录

### 预览生产构建

```bash
npm run preview
```

## 功能扩展指南

### 添加新的导航页面

1. 在 `src/pages/` 目录下创建新的页面组件
2. 在 `src/components/Sidebar.vue` 的 `navItems` 中添加新项
3. 在 `src/App.vue` 中添加对应的路由逻辑
4. 在 `src/i18n/locales/` 中添加翻译文本

### 添加新的工具

1. 在 `src/components/tools/` 目录下创建工具组件
2. 在 `src/pages/ToolsPage.vue` 的 `tools` 数组中添加新工具配置
3. 在 `src/components/tools/` 中添加对应的工具组件引用

### 添加新的站点分类

1. 在 `src/pages/SitesPage.vue` 的 `sitesData` 数组中添加新分类
2. 创建对应的图标组件（如需要）

### 添加新的语言

1. 在 `src/i18n/locales/` 目录下创建新的语言文件（如 `ja.json`）
2. 在 `src/i18n/index.js` 中注册新语言
3. 在 `src/components/Header.vue` 中添加语言切换逻辑

## 天气 API 说明

项目使用 `wttr.in` 作为天气数据源（免费，无需 API key）。如需使用其他天气服务：

1. 修改 `src/utils/weather.js` 中的 `getWeather` 函数
2. 如需使用 OpenWeatherMap 等需要 API key 的服务，请：
   - 在项目根目录创建 `.env` 文件
   - 添加 `VITE_WEATHER_API_KEY=your_api_key`
   - 在代码中使用 `import.meta.env.VITE_WEATHER_API_KEY` 获取

## 设计说明

### Glassmorphism 样式

项目使用自定义的 CSS 类实现玻璃态效果：

- `.glass-sidebar`：侧边栏玻璃效果
- `.glass-main`：主内容区玻璃效果
- `.glass-card`：卡片玻璃效果
- `.glass-input`：输入框玻璃效果

所有样式都支持暗色模式，通过 `dark:` 前缀实现。

### 图标系统

项目使用自定义 SVG 图标组件，所有图标位于 `src/components/icons/` 目录。不使用 emoji，确保跨平台一致性。

## 浏览器支持

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 开发规范

### 代码注释

- 所有文件头部包含文件说明注释
- 所有方法/类前包含介绍注释
- 复杂逻辑处添加说明注释
- 高扩展潜力处添加 TODO 注释

### 组件规范

- 使用 Vue 3 Composition API
- 组件命名使用 PascalCase
- Props 和 Emits 使用 TypeScript 风格注释（如需要）

## 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

## 使用指南

### 1. 用户系统

#### 注册和登录

1. **注册新用户**：
   - 点击页面右上角的用户图标
   - 选择"注册"（如果没有账号）
   - 填写用户名、邮箱和密码（至少6位）
   - 点击"注册"完成注册

2. **登录**：
   - 点击页面右上角的用户图标
   - 输入用户名和密码
   - 点击"登录"

3. **登出**：
   - 点击用户头像
   - 在下拉菜单中选择"登出"

#### 创建管理员账户

管理员账户需要通过数据库直接创建。有两种方式：

**方式一：使用 SQLite 命令行工具**

```bash
cd backend
sqlite3 database/gworkspace.db

# 在 SQLite 命令行中执行：
INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
VALUES ('admin', 'admin@example.com', '<bcrypt_hash>', 'admin', datetime('now'), datetime('now'));
```

**方式二：使用提供的脚本（推荐）**

项目已提供创建管理员账户的脚本：

1. 编辑 `backend/scripts/create-admin.js`，修改管理员信息：
   ```javascript
   const ADMIN_CONFIG = {
     username: 'admin',           // 修改为你的用户名
     email: 'admin@example.com',  // 修改为你的邮箱
     password: 'admin123456',      // 修改为你的密码
     role: 'admin'
   }
   ```

2. 运行脚本：
   ```bash
   cd backend
   npm run create-admin
   ```
   或者：
   ```bash
   cd backend
   node scripts/create-admin.js
   ```

脚本会自动检查用户是否已存在，避免重复创建。

### 2. 管理后台

#### 访问管理后台

1. 使用管理员账户登录
2. 点击用户头像，选择"管理后台"
3. 或直接访问 `http://localhost:3000/admin`

#### 管理后台功能

**仪表盘** (`/admin`)
- 查看总体统计：总文章数、总浏览量、总点赞数、总评论数
- 快速操作：创建博客、管理博客、查看统计

**博客管理** (`/admin/blogs`)
- 查看所有博客（包括草稿）
- 创建新博客：点击"创建博客"按钮
- 编辑博客：点击文章行的编辑图标
- 删除博客：点击文章行的删除图标

**数据分析** (`/admin/analytics`)
- 查看访问统计：总访问量、独立访客数
- 查看热门文章排行

**评论管理** (`/admin/comments`)
- 查看所有评论
- 批准评论：点击"批准"按钮
- 标记垃圾评论：点击"标记垃圾"按钮
- 删除评论：点击"删除"按钮

### 3. 博客管理

#### 创建新博客

1. 登录管理员账户
2. 进入管理后台 → 博客管理
3. 点击"创建博客"按钮
4. 填写文章信息：
   - **标题**：文章标题
   - **分类 (Genre)**：文章分类，如 Tech、Design 等
   - **发布日期**：文章发布日期
   - **摘要**：文章摘要
   - **标签**：输入标签后按 Enter 添加
   - **内容**：Markdown 格式的文章内容
5. 点击"保存"提交

#### 编辑博客

1. 在博客管理页面找到要编辑的文章
2. 点击文章行的编辑图标
3. 修改文章信息
4. 点击"保存"提交更改

#### 删除博客

1. 在博客管理页面找到要删除的文章
2. 点击文章行的删除图标
3. 确认删除操作

### 4. 用户功能

#### 点赞文章

- **登录用户**：点击文章详情页的点赞按钮，点赞会与账户关联
- **匿名用户**：也可以点赞，但基于 IP 地址（同一 IP 只能点赞一次）

#### 评论文章

- **登录用户**：在文章详情页底部填写评论，评论会显示用户名
- **匿名用户**：需要填写姓名和邮箱（可选），评论会显示提供的姓名

### 5. 数据迁移

如果已有文件系统的博客文章，需要迁移到数据库：

```bash
npm run migrate
```

迁移脚本会：
1. 读取 `src/posts/` 目录下的所有文章
2. 将文章元数据和内容插入到数据库
3. 显示迁移结果统计

### 6. 环境配置

#### 后端环境变量

在 `backend/` 目录创建 `.env` 文件（可选）：

```env
# JWT 密钥（生产环境必须修改）
JWT_SECRET=your-secret-key-change-in-production

# JWT 过期时间（默认7天）
JWT_EXPIRES_IN=7d

# 数据库路径（默认：database/gworkspace.db）
DATABASE_PATH=database/gworkspace.db
```

#### 前端环境变量

在项目根目录创建 `.env` 文件（可选）：

```env
# API 服务器地址（默认：http://localhost:3001/api）
VITE_API_URL=http://localhost:3001/api
```

### 7. 生产部署

详细的部署指南请参考：

📖 [部署文档](./docs/DEPLOYMENT.md)

#### 快速部署步骤

1. **构建前端**
   ```bash
   npm run build
   ```

2. **配置环境变量**
   ```bash
   # 后端
   cd backend
   cp .env.example .env
   # 编辑 .env 文件，设置 JWT_SECRET 等
   
   # 前端（可选）
   cp .env.example .env
   # 编辑 .env 文件，设置 VITE_API_URL
   ```

3. **初始化数据库**
   ```bash
   npm run migrate
   cd backend
   npm run create-admin
   ```

4. **启动后端服务**
   ```bash
   # 使用 PM2（推荐）
   pm2 start backend/src/server.js --name gworkspace-backend
   
   # 或直接启动
   cd backend
   npm start
   ```

5. **配置 Nginx 反向代理**
   
   参考 [部署文档](./docs/DEPLOYMENT.md) 中的 Nginx 配置示例。

## 更新日志

### v2.1.0 (2025-01-XX)

- 🔍 **SEO 优化**：完整的 meta 标签、Open Graph、Twitter Card、结构化数据
- ⚡ **性能优化**：路由懒加载、代码分割，初始包大小减少 40%
- 📱 **响应式设计增强**：完整的移动端、平板、桌面适配
  - 移动端优化的侧边栏和导航
  - 响应式博客页面和管理后台
  - 触摸友好的交互设计
- 🗺️ **Sitemap 生成**：自动生成 sitemap.xml 和 robots.txt
- 📊 **优化文档**：详细的优化总结和使用指南

### v2.0.0 (2025-01-XX)

- 🔐 **用户系统**：完整的用户注册/登录功能，JWT Token 认证
- 👥 **管理后台**：管理员专用的后台管理系统
  - 博客管理：创建、编辑、删除博客
  - 数据分析：访问统计、热门文章排行
  - 评论管理：审核、删除、标记垃圾评论
- 💾 **数据持久化**：从文件系统迁移到 SQLite 数据库
- 🎯 **API 重构**：完整的 RESTful API，支持用户关联
- 🔒 **安全增强**：密码加密、认证中间件、权限控制
- 🚫 **移除前端编辑入口**：博客编辑功能仅限管理后台

### v1.1.0 (2025-12-20)

- ✨ 新增博客在线编辑器功能
- 🔗 集成 GitHub API，支持前端直接创建/更新文章
- 🔔 新文章通知功能，创建文章后在页面顶部显示推广横幅
- 📝 Markdown 实时预览编辑器
- 📚 新增 GitHub 配置文档

### v1.0.0 (2025-05-20)

- ✨ 初始版本发布
- 🎨 实现 Glassmorphism 设计风格
- 🌓 添加暗色模式支持
- 🌍 实现中英双语国际化
- 🌤️ 集成基于 IP 的天气 API
- 🛠️ 实现工具箱功能（计算器、编码转换、JSON 格式化）
- 📱 实现响应式布局
- 🔍 实现多搜索引擎支持
- 📝 完整的代码注释和文档

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请通过 GitHub Issues 联系。