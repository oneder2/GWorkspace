# 敏感词库管理指南

## 概述

本项目的敏感词库用于过滤留言板中的不当内容。词库存储在 `backend/src/utils/sensitiveWords.json` 文件中。

## 扩展屏蔽词库的方法

### 方法一：直接编辑JSON文件（推荐）

1. **打开文件**：`backend/src/utils/sensitiveWords.json`

2. **编辑 `words` 数组**，添加新的敏感词：
   ```json
   {
     "words": [
       "spam",
       "advertisement",
       "你的新敏感词1",
       "你的新敏感词2"
     ]
   }
   ```

3. **保存文件后重启服务器**，新词库会自动加载

### 方法二：批量导入（从文本文件）

如果你从其他地方搜索到了屏蔽词列表（每行一个词），可以使用以下步骤：

1. **准备文本文件**（例如 `new_words.txt`）：
   ```
   垃圾信息
   广告推广
   诈骗链接
   钓鱼网站
   恶意软件
   ```

2. **使用Node.js脚本批量导入**（创建临时脚本）：
   ```javascript
   // import-words.js
   import { addSensitiveWordsFromText } from './src/utils/contentFilter.js'
   import fs from 'fs'
   
   const text = fs.readFileSync('new_words.txt', 'utf-8')
   const count = addSensitiveWordsFromText(text)
   console.log(`成功导入 ${count} 个敏感词`)
   ```

3. **运行脚本**：
   ```bash
   node import-words.js
   ```

### 方法三：通过API添加（如果实现了管理接口）

可以在后端API中添加管理接口来动态添加敏感词，但需要重启服务器才能生效（当前实现）。

## 如何根据搜索到的屏蔽词更新词库

### 步骤1：收集屏蔽词

从以下来源收集屏蔽词：
- 开源敏感词库项目（如GitHub上的中文敏感词库）
- 常见的垃圾信息关键词
- 行业相关的敏感词汇
- 社区维护的词库列表

### 步骤2：整理词库格式

将收集到的词整理成以下格式之一：

**格式A：JSON数组**（直接添加到 `sensitiveWords.json`）
```json
{
  "words": [
    "词1",
    "词2",
    "词3"
  ]
}
```

**格式B：纯文本**（每行一个词，用于批量导入）
```
词1
词2
词3
```

### 步骤3：去重和验证

在添加前建议：
1. **去重**：确保没有重复的词
2. **验证**：检查是否有误判的常用词
3. **分类**：可以按类别组织（虽然当前实现是平铺的）

### 步骤4：批量导入示例

如果你有一个包含大量屏蔽词的文件 `blocked_words.txt`，可以使用以下脚本：

```javascript
// scripts/import-sensitive-words.js
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 读取现有词库
const wordsFile = join(__dirname, '../src/utils/sensitiveWords.json')
const existing = JSON.parse(readFileSync(wordsFile, 'utf-8'))
const existingWords = new Set(existing.words.map(w => w.toLowerCase()))

// 读取新词
const newWordsFile = join(__dirname, 'blocked_words.txt')
const newWordsText = readFileSync(newWordsFile, 'utf-8')
const newWords = newWordsText
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0)
  .map(word => word.toLowerCase())

// 合并并去重
const allWords = [...existingWords, ...newWords]
const uniqueWords = Array.from(new Set(allWords)).sort()

// 保存
const updated = {
  words: uniqueWords,
  notes: existing.notes || "敏感词库",
  updated_at: new Date().toISOString()
}

writeFileSync(wordsFile, JSON.stringify(updated, null, 2), 'utf-8')
console.log(`成功更新词库：原有 ${existingWords.size} 个词，新增 ${newWords.length} 个词，总计 ${uniqueWords.length} 个词`)
```

运行：
```bash
cd backend
node scripts/import-sensitive-words.js
```

## 注意事项

1. **重启服务器**：修改 `sensitiveWords.json` 后需要重启后端服务器才能生效
2. **单词边界匹配**：当前实现使用 `\b` 单词边界，避免误判（例如 "class" 不会匹配 "classic"）
3. **大小写不敏感**：所有匹配都是大小写不敏感的
4. **中英文支持**：支持中英文敏感词
5. **性能考虑**：如果词库非常大（>10000词），可能需要优化匹配算法

## 推荐的开源敏感词库

- **中文敏感词库**：https://github.com/fighting41love/funNLP
- **中文敏感词过滤**：https://github.com/observerss/textfilter
- **通用敏感词库**：可以在GitHub上搜索 "sensitive words" 或 "bad words list"

## 测试

添加新词后，建议测试：
1. 包含敏感词的留言应该被拒绝或过滤
2. 正常留言应该不受影响
3. 边界情况（如词的一部分）应该正确处理

