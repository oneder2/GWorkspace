# 博客文章目录

每篇文章使用独立的文件夹存储，博客信息和内容完全解耦。

## 文章文件夹结构

```
src/posts/
├── YYYY-MM-DD-article-slug/     # 文章文件夹（使用日期和slug命名）
│   ├── meta.json                 # 文章元数据（JSON格式）
│   ├── index.md                  # 文章内容（纯Markdown，无Frontmatter）
│   └── images/                   # 文章图片资源（可选）
│       ├── image1.jpg
│       └── image2.png
```

## 创建新文章

### 步骤1：创建文章文件夹

在 `src/posts/` 目录下创建新文件夹，命名格式：`YYYY-MM-DD-article-slug`

**示例：**
```bash
src/posts/2025-05-25-my-new-article/
```

### 步骤2：创建 meta.json 文件

在新文件夹中创建 `meta.json` 文件，包含文章的所有元数据：

```json
{
  "id": 4,
  "title": "我的新文章",
  "genre": "Tech",
  "category": "Tech",
  "date": "2025-05-25",
  "excerpt": "这是文章的简短摘要，会显示在博客列表页。",
  "tags": ["Vue", "JavaScript", "Frontend"],
  "views": 0,
  "likes": 0,
  "comments": 0
}
```

### 步骤3：创建 index.md 文件

在新文件夹中创建 `index.md` 文件，包含**纯Markdown内容**（不需要Frontmatter）：

```markdown
# 文章标题

这里是文章的正文内容，支持 **Markdown** 格式。

## 二级标题

- 列表项1
- 列表项2

### 代码块

\`\`\`javascript
// 代码示例
const example = 'Hello World'
console.log(example)
\`\`\`

### 插入图片

如果文章中有图片，将图片放在 `images/` 文件夹中：

![图片描述](./images/my-image.jpg)
```

### 步骤4：添加图片资源（可选）

如果需要图片，创建 `images/` 文件夹并添加图片文件：

```bash
src/posts/2025-05-25-my-new-article/
├── meta.json
├── index.md
└── images/
    ├── screenshot1.png
    └── diagram.jpg
```

## meta.json 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | number | ✅ | 文章唯一标识符，必须递增且唯一 |
| `title` | string | ✅ | 文章标题 |
| `genre` | string | ✅ | 文章分类（Tech, Code, Design等） |
| `category` | string | ❌ | 保留字段，与genre相同 |
| `date` | string | ✅ | 发布日期，格式：YYYY-MM-DD |
| `excerpt` | string | ✅ | 文章摘要，显示在列表页 |
| `tags` | array | ❌ | 标签数组 |
| `views` | number | ❌ | 阅读量，默认0 |
| `likes` | number | ❌ | 点赞数，默认0 |
| `comments` | number | ❌ | 评论数，默认0 |

## 优势

- **信息与内容解耦**：元数据（meta.json）和内容（index.md）完全分离
- **易于管理**：可以独立修改元数据而不影响内容
- **内容纯净**：Markdown文件只包含纯内容，无Frontmatter干扰
- **类型安全**：JSON格式便于验证和编辑

## 示例：完整文章结构

```
src/posts/2025-05-25-vue3-composition-api-guide/
├── meta.json
├── index.md
└── images/
    ├── composition-api-diagram.png
    └── code-example.png
```

**meta.json：**
```json
{
  "id": 4,
  "title": "Vue 3 Composition API 完整指南",
  "genre": "Code",
  "category": "Code",
  "date": "2025-05-25",
  "excerpt": "深入理解Vue 3 Composition API的核心概念和最佳实践",
  "tags": ["Vue", "JavaScript", "Composition API"],
  "views": 0,
  "likes": 0,
  "comments": 0
}
```

**index.md：**
```markdown
# Vue 3 Composition API 完整指南

Vue 3的Composition API为组件逻辑组织提供了全新的方式。

![Composition API架构图](./images/composition-api-diagram.png)

## 核心概念

Composition API的核心是...

\`\`\`javascript
import { ref, computed } from 'vue'

export default {
  setup() {
    const count = ref(0)
    const doubled = computed(() => count.value * 2)
    return { count, doubled }
  }
}
\`\`\`

更多内容...
```
