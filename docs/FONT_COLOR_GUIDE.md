# 字体颜色微调指南

本文档说明如何在 GWorkspace 项目中微调字体颜色。

## 字体颜色系统概览

项目使用 **Tailwind CSS** 作为主要样式框架，字体颜色主要通过以下方式设置：

1. **Tailwind Utility Classes** - 最常用方式
2. **CSS 变量** - 用于主题色
3. **自定义 CSS 类** - 用于全局样式
4. **内联样式** - 用于动态样式

## 方法一：使用 Tailwind Utility Classes（推荐）

### 基本用法

在 Vue 组件中直接使用 Tailwind 的文本颜色类：

```vue
<template>
  <!-- 基础颜色 -->
  <p class="text-slate-800">深灰色文字</p>
  <p class="text-slate-600">中等灰色文字</p>
  <p class="text-slate-400">浅灰色文字</p>
  
  <!-- 支持暗色模式 -->
  <p class="text-slate-800 dark:text-slate-200">亮色模式深色，暗色模式浅色</p>
</template>
```

### 常用颜色类

#### Slate 色系（项目主要使用）
- `text-slate-900` - 最深（几乎黑色）
- `text-slate-800` - 深色
- `text-slate-700` - 中深色
- `text-slate-600` - 中等
- `text-slate-500` - 中浅色
- `text-slate-400` - 浅色
- `text-slate-300` - 很浅
- `text-slate-200` - 极浅
- `text-slate-100` - 最浅（几乎白色）

#### 其他常用色系
- `text-gray-*` - 灰色系（类似 slate）
- `text-red-*` - 红色系（用于错误、点赞等）
- `text-green-*` - 绿色系（用于成功状态）
- `text-blue-*` - 蓝色系
- `text-white` / `text-black` - 纯色

### 暗色模式适配

```vue
<template>
  <!-- 方式1：使用 dark: 前缀 -->
  <p class="text-slate-800 dark:text-slate-200">
    亮色模式：深色文字 | 暗色模式：浅色文字
  </p>
  
  <!-- 方式2：使用 CSS 变量（动态主题色） -->
  <p style="color: var(--theme-primary-darker);">
    使用主题色变量
  </p>
</template>
```

## 方法二：在 style.css 中定义全局样式

### 修改现有样式类

编辑 `src/style.css`，在 `@layer components` 中添加或修改：

```css
/* 自定义文本颜色类 */
@layer components {
  .text-custom-primary {
    color: #475569; /* slate-600 */
  }
  
  .dark .text-custom-primary {
    color: #cbd5e1; /* slate-300 */
  }
  
  /* 更精细的控制 */
  .text-custom-secondary {
    color: rgba(71, 85, 105, 0.8); /* 带透明度 */
  }
}
```

### 修改特定组件的文本颜色

```css
/* 修改所有 glass-card 内的文字颜色 */
.glass-card {
  color: #1e293b; /* slate-800 */
}

.dark .glass-card {
  color: #e2e8f0; /* slate-200 */
}

/* 修改特定元素的文字颜色 */
.glass-card h1 {
  color: #0f172a; /* slate-900 */
}

.dark .glass-card h1 {
  color: #f1f5f9; /* slate-100 */
}
```

## 方法三：使用 CSS 变量（主题色）

### 在 style.css 中定义变量

```css
:root {
  /* 文本颜色变量 */
  --text-primary: #1e293b;      /* 主要文字 */
  --text-secondary: #64748b;    /* 次要文字 */
  --text-tertiary: #94a3b8;     /* 三级文字 */
}

.dark {
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
}
```

### 在组件中使用

```vue
<template>
  <p style="color: var(--text-primary);">主要文字</p>
  <p style="color: var(--text-secondary);">次要文字</p>
</template>
```

## 方法四：在组件中使用内联样式

### 静态样式

```vue
<template>
  <p style="color: #475569;">自定义颜色</p>
  <p :style="{ color: '#64748b' }">使用对象语法</p>
</template>
```

### 动态样式（响应式）

```vue
<template>
  <p :style="textStyle">动态颜色</p>
</template>

<script setup>
import { computed } from 'vue'

const isDark = ref(false)
const textStyle = computed(() => ({
  color: isDark.value ? '#cbd5e1' : '#1e293b'
}))
</script>
```

## 实际应用示例

### 示例1：调整博客文章标题颜色

**位置**: `src/pages/BlogPage.vue` 或 `src/pages/BlogDetailPage.vue`

```vue
<!-- 修改前 -->
<h3 class="text-2xl font-bold text-slate-800 dark:text-slate-200">
  {{ post.title }}
</h3>

<!-- 修改后 - 更深的颜色 -->
<h3 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
  {{ post.title }}
</h3>

<!-- 或者使用自定义颜色 -->
<h3 class="text-2xl font-bold" style="color: #0f172a;">
  {{ post.title }}
</h3>
```

### 示例2：调整侧边栏导航文字颜色

**位置**: `src/components/Sidebar.vue`

```vue
<!-- 修改前 -->
<span class="font-medium whitespace-nowrap">{{ item.name }}</span>

<!-- 修改后 - 更浅的颜色 -->
<span class="font-medium whitespace-nowrap text-slate-700 dark:text-slate-300">
  {{ item.name }}
</span>
```

### 示例3：调整工具按钮文字颜色

**位置**: `src/pages/ToolsPage.vue`

```vue
<!-- 修改前 -->
<span class="text-sm sm:text-base flex-1 truncate">{{ tool.name }}</span>

<!-- 修改后 - 使用内联样式 -->
<span 
  class="text-sm sm:text-base flex-1 truncate"
  :style="{ 
    color: currentTool === tool.id 
      ? '#0f172a' 
      : '#64748b' 
  }"
>
  {{ tool.name }}
</span>
```

### 示例4：全局调整所有文字颜色

**位置**: `src/style.css`

```css
/* 在 :root 中添加全局文字颜色 */
:root {
  --text-base: #1e293b; /* 基础文字颜色 */
}

.dark {
  --text-base: #f1f5f9;
}

/* 应用到 body */
body {
  color: var(--text-base);
}

/* 或者应用到所有元素 */
* {
  color: var(--text-base);
}
```

## 颜色对比度建议

为了确保可读性，建议遵循 WCAG 对比度标准：

- **正常文字**（16px+）：对比度至少 4.5:1
- **大文字**（18px+ 或 14px+ bold）：对比度至少 3:1

### 推荐的颜色组合

#### 亮色模式
- 深色文字：`#0f172a` (slate-900) 或 `#1e293b` (slate-800)
- 中等文字：`#475569` (slate-600) 或 `#64748b` (slate-500)
- 浅色文字：`#94a3b8` (slate-400) 或 `#cbd5e1` (slate-300)

#### 暗色模式
- 浅色文字：`#f1f5f9` (slate-100) 或 `#e2e8f0` (slate-200)
- 中等文字：`#cbd5e1` (slate-300) 或 `#94a3b8` (slate-400)
- 深色文字：`#64748b` (slate-500) 或 `#475569` (slate-600)

## 调试技巧

### 1. 使用浏览器开发者工具

1. 打开开发者工具（F12）
2. 选择要修改的元素
3. 在 Styles 面板中查看当前颜色
4. 直接修改颜色值查看效果
5. 复制修改后的代码到项目中

### 2. 临时测试颜色

在组件中添加临时样式：

```vue
<template>
  <p class="text-slate-800" style="color: red !important;">
    临时测试 - 红色文字
  </p>
</template>
```

### 3. 使用 Tailwind 的任意值语法

```vue
<template>
  <!-- 使用任意颜色值 -->
  <p class="text-[#475569]">自定义十六进制颜色</p>
  <p class="text-[rgb(71,85,105)]">使用 RGB</p>
  <p class="text-[rgba(71,85,105,0.8)]">使用 RGBA（带透明度）</p>
</template>
```

## 常见问题

### Q: 如何快速找到某个元素的颜色设置？

A: 使用浏览器开发者工具：
1. 右键点击元素 → "检查"
2. 在 Elements 面板查看应用的类名
3. 在 Styles 面板查看最终计算的颜色值

### Q: 修改后没有生效？

A: 检查以下几点：
1. 是否有更高优先级的样式覆盖（使用 `!important` 临时测试）
2. 是否正确保存文件
3. 开发服务器是否重新编译
4. 浏览器缓存（尝试硬刷新 Ctrl+Shift+R）

### Q: 如何统一调整整个页面的文字颜色？

A: 在 `src/style.css` 中修改全局样式：

```css
/* 调整所有文字的基础颜色 */
body {
  color: #1e293b; /* 亮色模式 */
}

.dark body {
  color: #f1f5f9; /* 暗色模式 */
}
```

### Q: 如何让文字颜色跟随主题色变化？

A: 使用 CSS 变量：

```css
:root {
  --text-color: var(--theme-primary-darker);
}

.dark {
  --text-color: var(--theme-primary-dark);
}
```

然后在组件中使用：

```vue
<p style="color: var(--text-color);">跟随主题的文字</p>
```

## 快速参考

### Tailwind 文本颜色类速查

```html
<!-- Slate 色系 -->
text-slate-900, text-slate-800, text-slate-700, text-slate-600,
text-slate-500, text-slate-400, text-slate-300, text-slate-200, text-slate-100

<!-- 其他常用 -->
text-white, text-black, text-red-500, text-green-500, text-blue-500

<!-- 暗色模式 -->
dark:text-slate-200, dark:text-slate-300, etc.
```

### 常用颜色值（十六进制）

```css
/* Slate 色系 */
#0f172a  /* slate-900 - 最深 */
#1e293b  /* slate-800 */
#334155  /* slate-700 */
#475569  /* slate-600 */
#64748b  /* slate-500 */
#94a3b8  /* slate-400 */
#cbd5e1  /* slate-300 */
#e2e8f0  /* slate-200 */
#f1f5f9  /* slate-100 - 最浅 */
```

## 总结

1. **优先使用 Tailwind 类** - 最简单、最一致
2. **需要全局修改时** - 在 `style.css` 中定义
3. **需要动态颜色时** - 使用内联样式或 CSS 变量
4. **确保对比度** - 保证文字可读性
5. **测试暗色模式** - 确保两种模式都正常显示

如有疑问，请参考 Tailwind CSS 官方文档：https://tailwindcss.com/docs/text-color

