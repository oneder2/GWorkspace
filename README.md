# GWorkspace

一个基于 Vue.js 的个人工作空间静态网站，采用 Glassmorphism（玻璃态）设计风格，支持暗色模式和中英双语切换。

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
- 模块化设计，便于集成 CMS 或 API

#### 5. 作品集 (Portfolio)
- 项目展示卡片
- 标签分类
- 模块化设计，便于添加新作品

## 技术栈

- **框架**：Vue 3 (Composition API)
- **构建工具**：Vite
- **样式**：Tailwind CSS
- **国际化**：Vue I18n
- **图标**：自定义 SVG 图标组件（不使用 emoji）

## 项目结构

```
GWorkspace/
├── src/
│   ├── components/          # 组件目录
│   │   ├── icons/          # SVG 图标组件
│   │   ├── tools/          # 工具箱子组件
│   │   ├── Header.vue      # 顶部状态栏
│   │   └── Sidebar.vue     # 侧边栏导航
│   ├── pages/              # 页面组件
│   │   ├── HomePage.vue
│   │   ├── SitesPage.vue
│   │   ├── ToolsPage.vue
│   │   ├── BlogPage.vue
│   │   └── PortfolioPage.vue
│   ├── composables/        # 组合式函数
│   │   └── useTheme.js    # 主题管理
│   ├── i18n/              # 国际化配置
│   │   ├── index.js
│   │   └── locales/
│   │       ├── zh.json    # 中文翻译
│   │       └── en.json    # 英文翻译
│   ├── utils/             # 工具函数
│   │   ├── weather.js     # 天气 API
│   │   └── icons.js       # 图标工具
│   ├── App.vue            # 根组件
│   ├── main.js            # 入口文件
│   └── style.css          # 全局样式
├── index.html             # HTML 模板
├── package.json           # 项目配置
├── vite.config.js         # Vite 配置
├── tailwind.config.js     # Tailwind 配置
└── README.md              # 项目文档
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

开发服务器将在 `http://localhost:3000` 启动

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

## 更新日志

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