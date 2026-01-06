# 样式系统文档

## 概述

项目采用模块化的样式系统，将样式按照页面和功能进行分离，避免硬编码样式，提高可维护性和可扩展性。

## 目录结构

```
src/
├── style.css              # 全局样式文件（Tailwind CSS、CSS变量、通用组件样式）
└── styles/
    └── pages/             # 页面样式目录
        ├── index.css      # 页面样式统一入口
        ├── BlogPage.css   # 博客页面样式
        ├── ToolsPage.css  # 工具页面样式
        └── SitesPage.css  # 站点导航页面样式
```

## 样式文件说明

### 1. 全局样式 (`src/style.css`)

包含：
- Tailwind CSS 导入
- CSS 变量定义（主题色、暗色模式等）
- 全局组件样式（玻璃效果、滚动条等）
- 通用工具类

**使用场景**：所有页面共享的样式

### 2. 页面样式 (`src/styles/pages/`)

每个页面有独立的CSS文件，包含：
- 页面特定的组件样式
- 页面内的交互效果（hover、active等）
- 页面布局相关样式

**命名规范**：`{PageName}Page.css`

**使用方式**：在对应的Vue组件中导入

```vue
<script setup>
// 导入页面样式
import '../styles/pages/BlogPage.css'
</script>
```

## 样式编写规范

### 1. 使用CSS变量

所有颜色、间距等应使用CSS变量，便于主题切换：

```css
.my-component {
  color: var(--theme-primary-darker);
  background: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent);
}
```

### 2. 支持暗色模式

使用 `.dark` 类选择器支持暗色模式：

```css
.my-component {
  background: rgba(255, 255, 255, 0.5);
}

.dark .my-component {
  background: rgba(15, 23, 42, 0.3);
}
```

### 3. 使用伪类处理交互

使用 `:hover`、`:active` 等伪类处理交互效果，避免在JavaScript中操作样式：

```css
.my-button {
  transition: all 0.2s ease;
  --hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent);
}

.my-button:hover {
  background-color: var(--hover-bg);
}
```

### 4. 类命名规范

- 使用 `{page}-{component}-{state}` 格式
- 例如：`blog-article-card`、`tool-select-btn-selected`

## 迁移指南

### 从内联样式迁移到CSS类

**之前（内联样式）：**
```vue
<button
  :style="{
    backgroundColor: 'color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent)',
    color: 'var(--theme-primary-darker)'
  }"
  @mouseenter="el.style.backgroundColor = 'var(--hover-bg)'"
>
  按钮
</button>
```

**之后（CSS类）：**
```vue
<button class="my-button">
  按钮
</button>
```

```css
/* 在对应的页面CSS文件中 */
.my-button {
  background-color: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent);
  color: var(--theme-primary-darker);
  transition: background-color 0.2s ease;
  --hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 70%, transparent);
}

.my-button:hover {
  background-color: var(--hover-bg);
}
```

## 最佳实践

1. **避免硬编码样式**：所有样式都应定义在CSS文件中
2. **使用CSS变量**：便于主题切换和维护
3. **支持暗色模式**：所有样式都应考虑暗色模式
4. **使用过渡效果**：为交互添加平滑的过渡动画
5. **模块化组织**：每个页面有独立的样式文件
6. **统一命名**：使用一致的类命名规范

## 注意事项

1. **CSS变量优先级**：CSS变量可以在组件中动态设置，但应优先使用类选择器
2. **性能考虑**：避免过度使用复杂的CSS选择器
3. **浏览器兼容性**：`color-mix()` 函数需要现代浏览器支持
4. **样式隔离**：页面样式应使用特定的类名前缀，避免样式冲突

## 未来扩展

- 为其他页面（HomePage、PortfolioPage等）创建独立CSS文件
- 创建组件样式目录（`src/styles/components/`）用于共享组件样式
- 考虑使用CSS Modules或Scoped CSS进一步隔离样式

