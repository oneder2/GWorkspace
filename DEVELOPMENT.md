# 开发指南

本文档说明如何开发和扩展 GWorkspace 项目。

## 开发环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

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
```

构建产物将输出到 `dist/` 目录。

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

### 组件规范

- 使用 Vue 3 Composition API
- 使用 `<script setup>` 语法
- Props 使用 `defineProps`
- Emits 使用 `defineEmits`

## 测试

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

### 环境变量

如需使用需要 API key 的服务（如天气API），创建 `.env` 文件：

```
VITE_WEATHER_API_KEY=your_api_key
```

在代码中使用：

```javascript
const apiKey = import.meta.env.VITE_WEATHER_API_KEY
```

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
