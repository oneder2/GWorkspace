/* Add the reviewed Oceannect production project to resume surfaces. */

INSERT OR IGNORE INTO projects
  (public_id, slug, title_zh, title_en, summary_zh, summary_en, role_zh, role_en,
   start_date, end_date, involvement, technologies, highlights_zh, highlights_en,
   featured, links, url, image_url, tags, status, surfaces, sort_order, created_at, updated_at)
VALUES
  ('project:oceannect', 'oceannect', 'Oceannect - 伴侣共享空间', 'Oceannect - Private Space for Couples',
   '面向伴侣的跨平台私密共享空间，以 Flutter 客户端和 FastAPI 后端承载日常记录、媒体时间线、互动、纪念日提醒与 AI 回忆总结。',
   'A cross-platform private space for couples, combining a Flutter client and FastAPI backend for daily updates, media timelines, interactions, anniversary reminders, and AI memory summaries.',
   '独立全栈与移动端工程师', 'Independent Full-Stack & Mobile Engineer',
   '2026-07', NULL, 'creator',
   '["Flutter","Dart","FastAPI","SQLAlchemy","PostgreSQL","Docker"]',
   '["实现伴侣绑定、文字/照片/视频/语音动态、评论与反应、时间线、纪念日、距离和共同目标，并提供分层 AI 日、周、年度及回忆册总结。","加固移动生产链路：采用 Argon2 与可撤销刷新会话、幂等发布、受限媒体上传、通知去重和 JPush/微信公众号入口，并配置 Docker/Alembic 部署、备份验证与健康监控。"]',
   '["Built partner pairing, text/photo/video/voice updates, comments and reactions, timelines, anniversaries, distance, shared goals, and tiered AI daily, weekly, yearly, and memory-book summaries.","Hardened mobile production with Argon2 and revocable refresh sessions, idempotent posting, constrained media uploads, notification deduplication, JPush and WeChat entry points, plus Docker/Alembic delivery, verified backups, and health monitoring."]',
   1,
   '[{"kind":"source","url":"https://github.com/oneder2/Oceannect"},{"kind":"demo","url":"https://oceannect.gellaronline.cc"}]',
   'https://oceannect.gellaronline.cc', NULL,
   '["Mobile","Private Sharing","Production Ops"]',
   'published', '["portfolio","gellaria","resume_web","resume_pdf"]', 25,
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE projects
SET
  title_zh = 'Oceannect - 伴侣共享空间',
  title_en = 'Oceannect - Private Space for Couples',
  summary_zh = '面向伴侣的跨平台私密共享空间，以 Flutter 客户端和 FastAPI 后端承载日常记录、媒体时间线、互动、纪念日提醒与 AI 回忆总结。',
  summary_en = 'A cross-platform private space for couples, combining a Flutter client and FastAPI backend for daily updates, media timelines, interactions, anniversary reminders, and AI memory summaries.',
  role_zh = '独立全栈与移动端工程师',
  role_en = 'Independent Full-Stack & Mobile Engineer',
  start_date = '2026-07',
  end_date = NULL,
  involvement = 'creator',
  technologies = '["Flutter","Dart","FastAPI","SQLAlchemy","PostgreSQL","Docker"]',
  highlights_zh = '["实现伴侣绑定、文字/照片/视频/语音动态、评论与反应、时间线、纪念日、距离和共同目标，并提供分层 AI 日、周、年度及回忆册总结。","加固移动生产链路：采用 Argon2 与可撤销刷新会话、幂等发布、受限媒体上传、通知去重和 JPush/微信公众号入口，并配置 Docker/Alembic 部署、备份验证与健康监控。"]',
  highlights_en = '["Built partner pairing, text/photo/video/voice updates, comments and reactions, timelines, anniversaries, distance, shared goals, and tiered AI daily, weekly, yearly, and memory-book summaries.","Hardened mobile production with Argon2 and revocable refresh sessions, idempotent posting, constrained media uploads, notification deduplication, JPush and WeChat entry points, plus Docker/Alembic delivery, verified backups, and health monitoring."]',
  featured = 1,
  links = '[{"kind":"source","url":"https://github.com/oneder2/Oceannect"},{"kind":"demo","url":"https://oceannect.gellaronline.cc"}]',
  url = 'https://oceannect.gellaronline.cc',
  tags = '["Mobile","Private Sharing","Production Ops"]',
  status = 'published',
  surfaces = '["portfolio","gellaria","resume_web","resume_pdf"]',
  sort_order = 25,
  updated_at = CURRENT_TIMESTAMP
WHERE slug = 'oceannect'
  AND NOT EXISTS (
    SELECT 1 FROM resume_content_revisions WHERE revision_id = '2026-09-oceannect-project'
  );

UPDATE projects
SET
  surfaces = '["portfolio","gellaria","resume_web"]',
  updated_at = CURRENT_TIMESTAMP
WHERE slug = 'farivy'
  AND NOT EXISTS (
    SELECT 1 FROM resume_content_revisions WHERE revision_id = '2026-09-oceannect-project'
  );

INSERT OR IGNORE INTO resume_content_revisions (revision_id, applied_at)
VALUES ('2026-09-oceannect-project', CURRENT_TIMESTAMP);
