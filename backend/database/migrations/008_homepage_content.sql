/**
 * 首页可变内容迁移脚本
 * 为管理员设置表增加首页内容 JSON 字段
 */

ALTER TABLE admin_settings ADD COLUMN homepage_content TEXT;

UPDATE admin_settings
SET homepage_content = '{"status":{"zh":"最近在整理这个角落的光线与秩序，让它更接近一处可以久留的个人空间。","en":"Lately I have been adjusting the light and order of this corner so it feels more like a personal place worth lingering in."},"slogan":{"zh":"愿这里既能安放好奇，也能容纳尚未说完的话。","en":"May this place hold both curiosity and the things not yet fully said."},"fallbackTasks":{"zh":["完善首页个人信息层","接入 Spotify 正在听卡片","把待办任务前置到首页"],"en":["Refine the homepage identity layer","Wire in the Spotify now-playing card","Surface tasks on the front page"]},"spotifyHint":{"zh":"有时这里会安静，有时会飘来一首正在循环的歌。","en":"Sometimes this corner stays quiet, and sometimes it carries the song currently on repeat."}}'
WHERE homepage_content IS NULL OR homepage_content = '';
