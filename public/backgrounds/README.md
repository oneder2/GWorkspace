# 背景图片目录

此目录用于存放项目的正式背景资源。

## 当前结构

- `default.jpg`
  旧版单图背景，保留作为兼容与备用资源。
- `workplace/*.webp`
  当前启用的同场景分时段背景资源。

## workplace 场景

运行时资源：

- `/backgrounds/workplace/dawn.webp`
- `/backgrounds/workplace/day.webp`
- `/backgrounds/workplace/dusk.webp`
- `/backgrounds/workplace/night.webp`

对应的切换配置位于 `src/config/backgroundScenes.js`，包含：

- 本地时间到时段的映射关系
- 每个时段的亮度参数
- light / dark 两套遮罩透明度策略

默认时段划分：

- `05:00-07:59` -> `dawn`
- `08:00-16:59` -> `day`
- `17:00-19:59` -> `dusk`
- `20:00-04:59` -> `night`

## 资源约定

- 优先使用 `webp`
- 推荐分辨率不低于 `1920x1080`
- 推荐保留同一构图的多时段变体，便于按本地时间切换
- 单张正式资源尽量控制在 `500KB` 以内

## 扩展方式

1. 将新场景资源放入 `public/backgrounds/<scene-id>/`
2. 在 `src/config/backgroundScenes.js` 中新增场景与时段配置
3. 如需启用新场景，调整默认场景标识即可
