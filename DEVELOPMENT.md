# 开发指南

本文档说明如何开发和扩展 GWorkspace 项目。

## v3.1.0 开发日志

日期：`2026-05-11`

### 与 v3.0.0 的差异

- `v3.0.0` 的核心任务是把工具箱工作台定版，并压实发布、构建和视觉基线。
- `v3.1.0` 的核心任务则转向首页个人信息层与低频维护闭环，让站点从“能用的工作台”进一步变成“可表达、可维护、可持续更新的个人站点”。

### 本轮开发重点

- **首页定位重写**：删去偏站内入口的堆叠表达，让首页重新围绕欢迎语、近况、Slogan、手边事情与音乐状态来组织。
- **后台维护接管 mock 数据**：将首页近况与手边事情从前端 mock 改为后台可编辑字段，站长可以低频维护，不再需要反复改代码。
- **Spotify 实时链路落地**：建立 `/api/spotify/login`、`/api/spotify/callback`、`/api/spotify/now-playing` 三段式后端接口，并将前端卡片默认指向固定路由。
- **运维视角前置**：在管理员系统页加入 Spotify 配置状态检查、系统健康、备份与对象资源视图，降低上线后的排查成本。
- **视觉与可读性收口**：完成首页文案气质替换、卡片边界收缩、亮暗色文本对比修正、搜索栏层级修复与单页响应式整理。

### 这一版的实现原则

- **低频信息手动维护**：像近况、Slogan、手边事情这类很少变动的信息，优先交给后台表单，避免引入额外自动化复杂度。
- **高频状态实时拉取**：像 Spotify 正在听这种即时状态，优先通过接口按访问实时获取，避免后台手动更新带来的冗余工作。
- **状态可见性优先**：对于需要排障的能力，不只要“能用”，还要在后台直接看见当前配置是否完整、令牌是否有效、回调路径是否正确。

### 后续建议方向

- **首页信息 schema 继续统一**：如果后续还要加入更多个人模块，建议继续沿用后台配置化结构，避免再次回到散落在前端的硬编码状态。
- **Spotify 状态可继续增强**：后续可补充最近一次请求结果、最近一次错误信息与授权时间，用于更快定位 API 故障。
- **AI 内容面板继续收口**：目前已形成轻工作流雏形，下一步适合继续统一“站长赠语 / 日更内容 / 候选种子”的后台维护入口。

## 开发环境要求

- Node.js 20.x（使用 `.nvmrc`，与 CI 和生产部署保持一致）
- npm 10.x（随 Node 20 安装）

```bash
nvm use
node -v
npm -v
```

## 项目启动

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

开发服务器将在 `http://localhost:3000` 启动，支持热重载。

### 3. 构建生产版本

```bash
npm run build
npm run check:seo
npm run check:cors
npm run check:backend-seo
npm run check:backend-routes
npm run check:backend-logs
npm run check:env
npm run check:frontend-budget
npm run check:frontend-debug
npm run audit:frontend
npm run audit:backend
```

构建产物将输出到 `dist/` 目录。

### 4. 后端基础验证

```bash
cd backend
npm ci --omit=dev
DATABASE_PATH="/tmp/gworkspace-dev-check.db" npm run db:prepare
DATABASE_PATH="/tmp/gworkspace-dev-check.db" npm run db:check
cd ..
npm run check:backend-routes
```

## 项目架构

### 组件结构

项目采用组件化架构，主要分为：

- **页面组件** (`src/pages/`): 各个导航页面的主组件
- **通用组件** (`src/components/`): 可复用的UI组件
- **工具组件** (`src/components/tools/`): 工具箱中的各个工具
- **图标组件** (`src/components/icons/`): SVG图标组件

### 状态管理

项目使用 Vue 3 Composition API 进行状态管理，主要状态包括：

- 当前标签页 (`currentTab`)
- 侧边栏折叠状态 (`sidebarCollapsed`)
- 主题模式 (`isDark`)
- 语言设置 (`locale`)

### 样式系统

- **Tailwind CSS**: 主要样式框架
- **自定义CSS类**: 玻璃态效果样式类
- **暗色模式**: 通过 `dark:` 前缀实现

## 扩展指南

### 添加新页面

1. 在 `src/pages/` 创建新页面组件
2. 在 `src/components/Sidebar.vue` 的 `navItems` 中添加导航项
3. 在 `src/App.vue` 中添加页面路由逻辑
4. 在 `src/i18n/locales/` 中添加翻译文本

示例：

```vue
// src/pages/NewPage.vue
<template>
  <div class="animate-fade-in">
    <h1>{{ $t('newPage.title') }}</h1>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
```

### 添加新工具

1. 在 `src/components/tools/` 创建工具组件
2. 在 `src/pages/ToolsPage.vue` 的 `tools` 数组中添加配置
3. 创建对应的图标组件（如需要）

示例：

```vue
// src/components/tools/NewTool.vue
<template>
  <div>
    <!-- 工具界面 -->
  </div>
</template>

<script setup>
// 工具逻辑
</script>
```

### 添加新站点分类

在 `src/pages/SitesPage.vue` 的 `sitesData` 数组中添加：

```javascript
{
  id: 'newCategory',
  name: 'New Category',
  icon: NewIcon,
  links: [
    { title: 'Site Name', url: 'https://example.com', desc: 'Description' }
  ]
}
```

### 添加新语言

1. 在 `src/i18n/locales/` 创建新语言文件（如 `ja.json`）
2. 在 `src/i18n/index.js` 中注册新语言：

```javascript
import ja from './locales/ja.json'

export const i18n = createI18n({
  // ...
  messages: {
    zh,
    en,
    ja  // 添加新语言
  }
})
```

3. 在 `src/components/Header.vue` 中添加语言切换逻辑

## 代码规范

### 注释规范

- **文件头部**: 每个文件顶部应包含文件说明注释
- **方法注释**: 每个方法前应包含功能说明
- **复杂逻辑**: 复杂逻辑处应添加说明注释
- **TODO注释**: 在需要后续改进的地方添加 TODO 注释

### 命名规范

- **组件**: PascalCase (如 `HomePage.vue`)
- **文件**: kebab-case (如 `use-theme.js`)
- **变量/函数**: camelCase (如 `currentTab`)
- **常量**: UPPER_SNAKE_CASE (如 `API_BASE_URL`)

### 性能优化规范

- **计算密集型逻辑**：如敏感词过滤、复杂解析等，应考虑引入缓存或预编译机制。
- **资源复用**：在后端循环中避免重复创建正则表达式或数据库连接。
- **前端防抖**：对于频繁触发的输入或滚动事件，应使用防抖（Debounce）或节流（Throttle）。
- **交互反馈**：所有涉及剪贴板、异步提交的操作，必须提供明确的视觉反馈（见样式系统文档）。

## 调试与工具

### 前端测试

项目主要关注前端功能的集成测试：

1. **功能测试**: 测试各个功能模块是否正常工作
2. **API测试**: 测试前后端API交互是否正常
3. **集成测试**: 测试完整用户流程

### 测试顺序

1. 前端操作是否正常
2. 前后端API交互是否正常
3. 后端响应是否正常
4. 前端是否正确响应

## 部署

### 静态部署

项目构建后可以部署到任何静态托管服务：

- Vercel
- Netlify
- GitHub Pages
- 其他静态托管服务

当前生产前台使用 Vercel。`vercel.json` 负责两类托管层配置：

- 将旧 `/sites`、`/tools` 永久重定向到 `/workspace`
- 为前台响应补充低风险安全头：`X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`、`X-Frame-Options`

### 后端部署 gate

后端通过 GitHub Actions 部署到自建服务器。部署脚本会在启动 PM2 后执行 live gate：

- `/health` 必须返回 `status: ok` 和 `database: ok`
- 后台 AI 种子接口的 `PATCH` CORS 预检必须通过
- 动态 sitemap 必须输出 `https://www.gellaronline.cc/workspace`
- 动态 sitemap 不能包含 `workspace.gellaronline.cc`、`/sites`、`/tools`

`better-sqlite3` 当前固定在 `9.4.3`。不要在没有服务器编译链验证的情况下升级到 `12.x`，该版本在当前服务器环境可能回退到源码编译并导致部署失败。

### 环境变量

如需使用需要 API key 的服务（如天气API），创建 `.env` 文件：

```
VITE_WEATHER_API_KEY=your_api_key
```

在代码中使用：

```javascript
const apiKey = import.meta.env.VITE_WEATHER_API_KEY
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

在 `src/pages/SitesPage.vue` 的 `sitesData` 数组中添加新分类，并创建对应的图标组件（如需要）。

### 添加新的语言

1. 在 `src/i18n/locales/` 目录下创建新的语言文件（如 `ja.json`）
2. 在 `src/i18n/index.js` 中注册新语言
3. 在 `src/components/Header.vue` 中添加语言切换逻辑

## 常见问题

### 1. 天气API无法获取数据

- 检查网络连接
- 确认 `wttr.in` API 是否可访问
- 查看浏览器控制台错误信息
- 如需要，可替换为其他天气API服务

### 2. 暗色模式不生效

- 检查 `tailwind.config.js` 中 `darkMode: 'class'` 配置
- 确认 `useTheme` composable 正确应用了 `dark` class

### 3. 国际化文本不显示

- 检查 `src/i18n/locales/` 中是否有对应语言的翻译文件
- 确认翻译 key 是否正确

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证。
