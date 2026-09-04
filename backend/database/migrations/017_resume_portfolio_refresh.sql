/*
 * Evidence-based resume and portfolio refresh.
 * The revision receipt matters because this repository replays every migration
 * on startup; reviewed content should only be installed once.
 */

CREATE TABLE IF NOT EXISTS resume_content_revisions (
  revision_id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

UPDATE resume_profile
SET
  headline_zh = '全栈软件工程师 | AI 与本地优先产品',
  headline_en = 'Full-Stack Software Engineer | AI & Local-First Products',
  summary_zh = '全栈软件工程师，具备商业 AI SaaS 与独立产品的端到端开发经验。能够使用 Next.js、Vue、Python、Rust 与 Flutter 构建 Web、桌面和移动应用，并覆盖数据建模、支付安全、云端部署与产品界面。',
  summary_en = 'Full-stack software engineer with end-to-end experience across a commercial AI SaaS and independent products. Builds web, desktop, and mobile applications with Next.js, Vue, Python, Rust, and Flutter, spanning data modeling, payment security, cloud delivery, and product UI.',
  pdf_project_limit = 3,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 1
  AND NOT EXISTS (
    SELECT 1 FROM resume_content_revisions WHERE revision_id = '2026-09-project-portfolio'
  );

UPDATE resume_skills
SET
  name_zh = '编程语言',
  name_en = 'Languages',
  items = '["TypeScript","JavaScript","Python","Rust","Dart","SQL","C#"]',
  surfaces = '["resume_web","resume_pdf"]',
  sort_order = 10,
  updated_at = CURRENT_TIMESTAMP
WHERE sort_order = 10
  AND NOT EXISTS (
    SELECT 1 FROM resume_content_revisions WHERE revision_id = '2026-09-project-portfolio'
  );

UPDATE resume_skills
SET
  name_zh = '前端与移动端',
  name_en = 'Frontend & Mobile',
  items = '["React","Next.js","Vue 3","Flutter","Tailwind CSS"]',
  surfaces = '["resume_web","resume_pdf"]',
  sort_order = 20,
  updated_at = CURRENT_TIMESTAMP
WHERE sort_order = 20
  AND NOT EXISTS (
    SELECT 1 FROM resume_content_revisions WHERE revision_id = '2026-09-project-portfolio'
  );

UPDATE resume_skills
SET
  name_zh = '后端与数据',
  name_en = 'Backend & Data',
  items = '["Node.js","Express","FastAPI","Supabase","PostgreSQL","SQLite"]',
  surfaces = '["resume_web","resume_pdf"]',
  sort_order = 30,
  updated_at = CURRENT_TIMESTAMP
WHERE sort_order = 30
  AND NOT EXISTS (
    SELECT 1 FROM resume_content_revisions WHERE revision_id = '2026-09-project-portfolio'
  );

INSERT OR IGNORE INTO resume_skills
  (public_id, name_zh, name_en, items, status, surfaces, sort_order, created_at, updated_at)
VALUES
  ('skill:platform-delivery', '平台与交付', 'Platform & Delivery',
   '["Tauri","AWS Lambda","Docker","Vercel","GitHub Actions","Stripe"]',
   'published', '["resume_web","resume_pdf"]', 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('skill:product-visual', '产品与视觉', 'Product & Visual',
   '["UI/UX Design","Digital Painting","Photoshop","Krita","Game Art"]',
   'published', '["resume_web"]', 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO public_experiences
  (public_id, kind, organization_zh, organization_en, title_zh, title_en,
   location_zh, location_en, summary_zh, summary_en, highlights_zh, highlights_en,
   start_date, end_date, canonical_url, media_ids, status, sort_order, section,
   surfaces, created_at, updated_at)
VALUES
  ('experience:citeai-commercial', 'employment', 'CiteAI', 'CiteAI',
   '全栈软件工程师（商业 SaaS）', 'Full-Stack Software Engineer (Commercial SaaS)',
   '远程', 'Remote',
   '参与交付面向学术写作的商业 AI SaaS，负责从文档编辑、引用检索验证到计费和生产安全的跨栈工程工作。',
   'Delivered a commercial AI SaaS for academic writing, working across document editing, citation retrieval and verification, billing, and production security.',
   '["贯通 Next.js 编辑器、Supabase 领域数据模型与 FastAPI/AWS Lambda 引用引擎，支持从句子识别到来源验证的完整链路。","强化认证与支付边界：加入资源归属校验、服务端令牌、Stripe Webhook 幂等处理及配额周期刷新。","完善 APA、MLA、Chicago、Harvard 与 IEEE 引用格式及 DOCX、HTML、BibTeX 导出，并通过 Jest、评测工具和 CI 构建保障交付。"]',
   '["Connected the Next.js editor, domain-modeled Supabase data, and a FastAPI/AWS Lambda citation engine into a complete claim-to-source verification flow.","Hardened authentication and billing boundaries with ownership checks, server-side service tokens, idempotent Stripe webhooks, and period-based quota refresh.","Delivered APA, MLA, Chicago, Harvard, and IEEE formatting plus DOCX, HTML, and BibTeX export, backed by Jest, evaluation tooling, and CI builds."]',
   '2026-01', '2026-05', 'https://citeai.co', '[]', 'published', 10, 'experience',
   '["resume_web","resume_pdf"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE public_experiences
SET
  kind = 'employment',
  organization_zh = 'CiteAI',
  organization_en = 'CiteAI',
  title_zh = '全栈软件工程师（商业 SaaS）',
  title_en = 'Full-Stack Software Engineer (Commercial SaaS)',
  location_zh = '远程',
  location_en = 'Remote',
  summary_zh = '参与交付面向学术写作的商业 AI SaaS，负责从文档编辑、引用检索验证到计费和生产安全的跨栈工程工作。',
  summary_en = 'Delivered a commercial AI SaaS for academic writing, working across document editing, citation retrieval and verification, billing, and production security.',
  highlights_zh = '["贯通 Next.js 编辑器、Supabase 领域数据模型与 FastAPI/AWS Lambda 引用引擎，支持从句子识别到来源验证的完整链路。","强化认证与支付边界：加入资源归属校验、服务端令牌、Stripe Webhook 幂等处理及配额周期刷新。","完善 APA、MLA、Chicago、Harvard 与 IEEE 引用格式及 DOCX、HTML、BibTeX 导出，并通过 Jest、评测工具和 CI 构建保障交付。"]',
  highlights_en = '["Connected the Next.js editor, domain-modeled Supabase data, and a FastAPI/AWS Lambda citation engine into a complete claim-to-source verification flow.","Hardened authentication and billing boundaries with ownership checks, server-side service tokens, idempotent Stripe webhooks, and period-based quota refresh.","Delivered APA, MLA, Chicago, Harvard, and IEEE formatting plus DOCX, HTML, and BibTeX export, backed by Jest, evaluation tooling, and CI builds."]',
  start_date = '2026-01',
  end_date = '2026-05',
  canonical_url = 'https://citeai.co',
  status = 'published',
  section = 'experience',
  surfaces = '["resume_web","resume_pdf"]',
  sort_order = 10,
  updated_at = CURRENT_TIMESTAMP
WHERE public_id = 'experience:citeai-commercial'
  AND NOT EXISTS (
    SELECT 1 FROM resume_content_revisions WHERE revision_id = '2026-09-project-portfolio'
  );

INSERT OR IGNORE INTO projects
  (public_id, slug, title_zh, title_en, summary_zh, summary_en, role_zh, role_en,
   start_date, end_date, involvement, technologies, highlights_zh, highlights_en,
   featured, links, url, image_url, tags, status, surfaces, sort_order, created_at, updated_at)
VALUES
  ('project:vana', 'vana', 'Vana - 本地优先文档库', 'Vana - Local-First Document Vault',
   '跨平台本地优先文档应用，以 SQLite 保存写作数据，通过 Supabase 完成账号与增量同步，并支持多格式导出。',
   'A cross-platform local-first document app that stores writing in SQLite, adds account-based incremental sync through Supabase, and exports multiple formats.',
   '独立产品工程师', 'Independent Product Engineer', '2026-01', NULL, 'creator',
   '["Tauri v2","Rust","React","TypeScript","SQLite","Supabase"]',
   '["将文档写入本地 SQLite，并实现 Supabase Magic Link 登录与自动增量同步，保持离线写作路径独立可用。","构建文档库、标签、归档与回收站，以及 PDF、DOCX、Markdown 导出和跨主题渲染；覆盖 Linux、Windows 与 Android Beta。"]',
   '["Persisted documents in local SQLite and added Supabase Magic Link authentication with automatic incremental sync while keeping offline writing independently usable.","Built library, tagging, archive, trash, PDF/DOCX/Markdown export, and theme-aware rendering across Linux, Windows, and Android Beta."]',
   1, '[{"kind":"source","url":"https://github.com/oneder2/Vana"}]', 'https://github.com/oneder2/Vana', NULL,
   '["Local-first","Desktop","Sync"]', 'published', '["portfolio","gellaria","resume_web","resume_pdf"]', 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('project:farivy', 'farivy', 'Farivy - 离线训练记录', 'Farivy - Offline Training Log',
   'Flutter 本地优先健身记录应用，覆盖周期计划、训练会话恢复、渐进超负荷、历史回顾和基础数据分析。',
   'A local-first Flutter training log spanning recurring plans, recoverable workout sessions, progressive overload, history, and practical analytics.',
   '独立移动端开发者', 'Independent Mobile Developer', '2026-03', NULL, 'creator',
   '["Flutter","Dart","Riverpod","SQLite","Local Notifications"]',
   '["设计 SQLite v13 数据模型，将训练处方和动作快照持久化，保证中断恢复时的上下文一致性并限制单一活动会话。","实现 RPE、1RM 预估、杠铃片计算、三种重量单位、休息通知，以及 28 天频率、8 周容量趋势和 PR 分析。"]',
   '["Designed a SQLite v13 model that persists workout prescriptions and exercise snapshots, preserving recovery context while enforcing a single active session.","Implemented RPE tracking, 1RM estimates, plate calculation, three weight units, rest notifications, 28-day frequency, 8-week volume trends, and PR analysis."]',
   1, '[{"kind":"source","url":"https://github.com/oneder2/Farivy"}]', 'https://github.com/oneder2/Farivy', NULL,
   '["Mobile","Local-first","Analytics"]', 'published', '["portfolio","gellaria","resume_web","resume_pdf"]', 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('project:oceanseo', 'oceanseo', '潮汐计划 - 桌面计划助手', 'Tideplan - Desktop Planning Assistant',
   '面向 Linux 的 Tauri 桌面计划助手，将多时间跨度任务、提醒、AI 食谱、采购清单与个人项目周报整合到本地工作流。',
   'A Linux-focused Tauri planning assistant that combines multi-horizon tasks, reminders, AI meal plans, shopping lists, and project reviews in a local workflow.',
   '独立桌面端开发者', 'Independent Desktop Developer', '2026-09', NULL, 'creator',
   '["Tauri v2","Rust","React","TypeScript","SQLite","OpenAI Responses API"]',
   '["实现系统托盘、开机自启、每日通知和原生 SQLite 持久化；API 密钥仅保存在本机应用数据目录并限制文件权限。","构建基于 Git 元数据的项目扫描与 AI 周报，在人工审核后通过带 Schema 校验和幂等回执的流程同步公开项目亮点。"]',
   '["Implemented tray residence, autostart, daily notifications, and native SQLite persistence, while API credentials stay in the app data directory with restricted file permissions.","Built Git-metadata project scans and AI weekly reviews with human approval, schema validation, and idempotent receipts before publishing project highlights."]',
   1, '[{"kind":"source","url":"https://github.com/oneder2/Oceanseo"}]', 'https://github.com/oneder2/Oceanseo', NULL,
   '["Desktop","Automation","AI Workflow"]', 'published', '["portfolio","gellaria","resume_web"]', 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('project:moblify', 'moblify', 'Moblify - 自动化短视频流水线', 'Moblify - Automated Short-Video Pipeline',
   '自动生成、筛选和渲染模拟类竖屏视频的 AI 流水线，连接物理模拟、代理评分、Canvas 预览与视频合成。',
   'An AI pipeline for generating, ranking, and rendering vertical simulation videos across physics, proxy scoring, Canvas preview, and video composition.',
   '独立全栈开发者', 'Independent Full-Stack Developer', '2026-03', '2026-03', 'creator',
   '["Python","FastAPI","Next.js","OpenCV","FFmpeg","Canvas"]',
   '["以反转指数、香农熵和时长效率构建代理评分，自动筛选更具戏剧性的模拟对局。","实现 9:16 OpenCV 渲染、音效混流与轻量 Canvas 回放预览，打通从模拟结果到短视频成片的生产链路。"]',
   '["Built proxy scoring from reversal index, Shannon entropy, and duration efficiency to select more dramatic simulation runs.","Implemented 9:16 OpenCV rendering, audio mixing, and lightweight Canvas replay to connect simulation output to finished short-form video."]',
   1, '[{"kind":"source","url":"https://github.com/oneder2/symmetrical-octo-invention"}]', 'https://github.com/oneder2/symmetrical-octo-invention', NULL,
   '["Automation","Video","Scoring"]', 'published', '["portfolio","resume_web"]', 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE projects
SET
  title_zh = 'CiteAI - AI 学术引用平台',
  title_en = 'CiteAI - AI Citation Platform',
  summary_zh = '商业化学术写作 SaaS：识别需要引用的论断，从学术与 Web 数据源检索证据，经模型验证后生成多种格式的引用与参考文献。',
  summary_en = 'A commercial academic-writing SaaS that detects claims, retrieves evidence from scholarly and web sources, verifies support with language models, and produces multi-style citations.',
  role_zh = '全栈软件工程师',
  role_en = 'Full-Stack Software Engineer',
  start_date = '2026-01',
  end_date = '2026-05',
  involvement = 'collaborator',
  technologies = '["Next.js","TypeScript","Supabase","FastAPI","AWS Lambda","Stripe"]',
  highlights_zh = '["连接 NLP 句子识别、OpenAlex/Tavily 检索、BM25 排序与模型验证，并将结果回写文档编辑工作流。","完成领域化数据库切换、支付与配额安全加固、引用格式化及多格式导出，并建立测试和 CI/CD 交付链路。"]',
  highlights_en = '["Connected NLP sentence detection, OpenAlex/Tavily retrieval, BM25 ranking, and model verification to the document editing workflow.","Delivered domain-modeled data migration, billing and quota hardening, citation formatting, multi-format export, tests, and CI/CD delivery."]',
  tags = '["Commercial SaaS","AI Retrieval","Payments"]',
  links = '[{"kind":"demo","url":"https://citeai.co"}]',
  url = 'https://citeai.co',
  featured = 1,
  status = 'published',
  surfaces = '["portfolio","gellaria","resume_web"]',
  sort_order = 10,
  updated_at = CURRENT_TIMESTAMP
WHERE slug = 'citeai'
  AND NOT EXISTS (
    SELECT 1 FROM resume_content_revisions WHERE revision_id = '2026-09-project-portfolio'
  );

UPDATE projects
SET
  title_zh = 'GWorkspace - 个人工作空间',
  title_en = 'GWorkspace - Personal Workspace',
  summary_zh = '持续演进的全栈个人工作平台，将生产力工具、写作、公开档案、管理后台和 3D 交互世界统一在一个可部署系统中。',
  summary_en = 'An evolving full-stack workspace that unifies productivity tools, writing, public records, administration, and an interactive 3D world in one deployable system.',
  role_zh = '创建者与全栈维护者',
  role_en = 'Creator & Full-Stack Maintainer',
  start_date = '2025-12',
  end_date = NULL,
  involvement = 'creator',
  technologies = '["Vue 3","Node.js","Express","SQLite","Next.js","Three.js"]',
  highlights_zh = '["建立单一公开内容权威源，通过版本化 Resume API 同步驱动作品集、PDF 简历客户端与 Gellaria 3D 展厅。","将 Vue/Express/SQLite 工作空间扩展为 monorepo，覆盖认证、管理后台、写作工具、自动化检查与 Next.js/Three.js 交互世界。"]',
  highlights_en = '["Established one authoritative public-content source that drives the portfolio, versioned Resume API, PDF client, and Gellaria 3D exhibition.","Expanded a Vue/Express/SQLite workspace into a monorepo with authentication, administration, writing tools, automated checks, and a Next.js/Three.js world."]',
  tags = '["Full-stack","Content API","3D Web"]',
  links = '[{"kind":"source","url":"https://github.com/oneder2/GWorkspace"},{"kind":"demo","url":"https://gellaronline.cc"}]',
  url = 'https://gellaronline.cc/workspace',
  featured = 1,
  status = 'published',
  surfaces = '["portfolio","gellaria","resume_web","resume_pdf"]',
  sort_order = 20,
  updated_at = CURRENT_TIMESTAMP
WHERE slug = 'gworkspace'
  AND NOT EXISTS (
    SELECT 1 FROM resume_content_revisions WHERE revision_id = '2026-09-project-portfolio'
  );

UPDATE projects
SET
  title_zh = 'Vana - 本地优先文档库',
  title_en = 'Vana - Local-First Document Vault',
  summary_zh = '跨平台本地优先文档应用，以 SQLite 保存写作数据，通过 Supabase 完成账号与增量同步，并支持多格式导出。',
  summary_en = 'A cross-platform local-first document app that stores writing in SQLite, adds account-based incremental sync through Supabase, and exports multiple formats.',
  role_zh = '独立产品工程师',
  role_en = 'Independent Product Engineer',
  start_date = '2026-01',
  end_date = NULL,
  involvement = 'creator',
  technologies = '["Tauri v2","Rust","React","TypeScript","SQLite","Supabase"]',
  highlights_zh = '["将文档写入本地 SQLite，并实现 Supabase Magic Link 登录与自动增量同步，保持离线写作路径独立可用。","构建文档库、标签、归档与回收站，以及 PDF、DOCX、Markdown 导出和跨主题渲染；覆盖 Linux、Windows 与 Android Beta。"]',
  highlights_en = '["Persisted documents in local SQLite and added Supabase Magic Link authentication with automatic incremental sync while keeping offline writing independently usable.","Built library, tagging, archive, trash, PDF/DOCX/Markdown export, and theme-aware rendering across Linux, Windows, and Android Beta."]',
  tags = '["Local-first","Desktop","Sync"]',
  links = '[{"kind":"source","url":"https://github.com/oneder2/Vana"}]',
  url = 'https://github.com/oneder2/Vana',
  featured = 1,
  status = 'published',
  surfaces = '["portfolio","gellaria","resume_web","resume_pdf"]',
  sort_order = 30,
  updated_at = CURRENT_TIMESTAMP
WHERE slug = 'vana'
  AND NOT EXISTS (
    SELECT 1 FROM resume_content_revisions WHERE revision_id = '2026-09-project-portfolio'
  );

UPDATE projects
SET
  featured = 0,
  surfaces = '["portfolio","gellaria","resume_web"]',
  sort_order = CASE slug
    WHEN 'surfsmart' THEN 80
    WHEN 'twilight-zone' THEN 90
    WHEN 'personal-resume' THEN 70
    ELSE sort_order
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE slug IN ('surfsmart', 'twilight-zone', 'personal-resume')
  AND NOT EXISTS (
    SELECT 1 FROM resume_content_revisions WHERE revision_id = '2026-09-project-portfolio'
  );

UPDATE projects
SET
  surfaces = '["portfolio","resume_web"]',
  featured = 0,
  sort_order = 100,
  updated_at = CURRENT_TIMESTAMP
WHERE slug = 'portfolio-site'
  AND NOT EXISTS (
    SELECT 1 FROM resume_content_revisions WHERE revision_id = '2026-09-project-portfolio'
  );

INSERT OR IGNORE INTO resume_content_revisions (revision_id, applied_at)
VALUES ('2026-09-project-portfolio', CURRENT_TIMESTAMP);
