# 博客文章编写指南

## 文章存储结构

博客文章采用解耦的文件系统存储方式，每篇文章使用独立的文件夹，确保内容内聚和低耦合。

### 目录结构

```
src/posts/
├── YYYY-MM-DD-article-slug/     # 文章文件夹
│   ├── meta.json                 # 文章元数据（JSON格式）
│   ├── index.md                  # 文章内容（纯Markdown，无Frontmatter）
│   └── images/                   # 文章图片资源（可选）
│       ├── image1.jpg
│       └── image2.png
└── README.md                     # 说明文档
```

## 创建新文章

### 步骤1：创建文章文件夹

在 `src/posts/` 目录下创建新文件夹，命名格式：`YYYY-MM-DD-article-slug`

**命名规则：**
- 使用日期前缀（YYYY-MM-DD）
- 使用小写字母和连字符
- 使用有意义的slug（文章标题的简化版本）

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
  "genre": "Code",
  "category": "Code",
  "date": "2025-05-25",
  "excerpt": "这是文章摘要，会显示在列表页。",
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
├── index.md
└── images/
    ├── screenshot1.png
    └── diagram.jpg
```

在Markdown中使用相对路径引用：

```markdown
![截图说明](./images/screenshot1.png)
![架构图](./images/diagram.jpg)
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

## Markdown支持

文章内容支持完整的Markdown语法：

- **标题**：`# H1`, `## H2`, `### H3`
- **强调**：`**粗体**`, `*斜体*`
- **列表**：有序列表和无序列表
- **代码**：行内代码和代码块
- **链接**：`[文本](URL)`
- **图片**：`![alt](路径)`
- **引用**：`> 引用内容`
- **表格**：Markdown表格语法

## 图片使用最佳实践

1. **图片格式**：推荐使用 `.jpg`、`.png`、`.webp` 格式
2. **图片大小**：建议压缩图片以优化加载速度
3. **命名规范**：使用有意义的文件名，如 `screenshot-main-feature.png`
4. **路径引用**：始终使用相对路径 `./images/filename.jpg`

## 示例：完整文章结构

```
src/posts/2025-05-25-vue3-composition-api-guide/
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

## 注意事项

1. **ID唯一性**：确保每篇文章的ID是唯一的，建议按顺序递增
2. **日期格式**：日期必须使用 `YYYY-MM-DD` 格式
3. **文件夹命名**：使用小写字母和连字符，避免空格和特殊字符
4. **图片路径**：图片路径相对于文章文件夹，使用 `./images/` 前缀
5. **内容更新**：修改文章后，刷新页面即可看到更新

## 自动功能

系统会自动：
- 从文章数据中提取标签并显示在筛选栏
- 根据日期生成归档数据
- 按日期倒序排列文章
- 支持Markdown渲染和代码高亮

