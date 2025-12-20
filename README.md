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
- **在线编辑器**：支持通过前端直接创建和编辑文章
- **后端API**：基于 Express + SQLite 的全栈架构
- **数据持久化**：博客文章、点赞、评论、访问统计
- **新文章通知**：创建文章后在页面顶部显示推广通知
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

## 项目结构

```
GWorkspace/
├── src/                    # 前端源码
│   ├── components/        # 组件目录
│   │   ├── icons/         # SVG 图标组件
│   │   ├── tools/         # 工具箱子组件
│   │   ├── Header.vue      # 顶部状态栏
│   │   └── Sidebar.vue    # 侧边栏导航
│   ├── pages/             # 页面组件
│   │   ├── HomePage.vue
│   │   ├── SitesPage.vue
│   │   ├── ToolsPage.vue
│   │   ├── BlogPage.vue
│   │   └── BlogDetailPage.vue
│   ├── composables/       # 组合式函数
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
│   │   │   └── Visit.js
│   │   ├── routes/         # API路由
│   │   │   ├── blog.js
│   │   │   ├── comments.js
│   │   │   ├── likes.js
│   │   │   └── analytics.js
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

## 博客文章管理

### 在线编辑器

项目集成了博客在线编辑器，支持：

- **创建新文章**：点击博客页面的"创建文章"按钮
- **Markdown 编辑**：实时预览 Markdown 内容
- **元数据管理**：标题、分类、标签、摘要等
- **自动提交**：文章自动提交到 GitHub 仓库

### GitHub 集成配置

要使用在线编辑器功能，需要配置 GitHub App。详细配置步骤请参考：

📖 [GitHub API 集成配置指南](./docs/GITHUB_SETUP.md)

### 文章存储结构

文章采用解耦存储结构，每篇文章使用独立文件夹：

```
src/posts/
  └── YYYY-MM-DD-article-slug/
      ├── meta.json          # 文章元数据
      └── index.md          # 文章内容（Markdown）
```

详细说明请参考：

📖 [博客文章编写指南](./docs/BLOG_GUIDE.md)

## 更新日志

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