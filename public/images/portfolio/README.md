# 作品预览图目录

此目录用于存放作品集页面的项目预览图。

## 使用说明

1. 将每个项目的预览图放置在此目录下
2. 图片文件名建议使用项目标题的英文名或ID（小写，使用连字符分隔）
3. 支持的图片格式：jpg, jpeg, png, webp
4. 建议图片尺寸：800x600px 或 1200x900px
5. 图片大小建议控制在 500KB 以内

## 示例

- `glass-dashboard.jpg` - Glass Dashboard 项目的预览图
- `citeai.png` - CiteAI 项目的预览图
- `portfolio.webp` - Portfolio 项目的预览图

## 配置

在 `src/config/portfolio.js` 中为每个项目添加 `image` 字段：

```javascript
{
  title: 'Glass Dashboard',
  image: '/images/portfolio/glass-dashboard.jpg', // 预览图路径
  // ... 其他配置
}
```

如果未指定 `image` 字段，将使用默认的渐变背景。

