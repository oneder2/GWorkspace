/* Install the reviewed 16:10 portfolio preview set once. */

UPDATE projects
SET
  image_url = CASE slug
    WHEN 'citeai' THEN '/images/portfolio/citeai.webp'
    WHEN 'gworkspace' THEN '/images/portfolio/gworkspace.webp'
    WHEN 'oceannect' THEN '/images/portfolio/oceannect.webp'
    WHEN 'vana' THEN '/images/portfolio/vana.webp'
    WHEN 'farivy' THEN '/images/portfolio/farivy.webp'
    WHEN 'oceanseo' THEN '/images/portfolio/oceanseo.webp'
    WHEN 'moblify' THEN '/images/portfolio/moblify.webp'
    WHEN 'personal-resume' THEN '/images/portfolio/personal-resume.webp'
    WHEN 'surfsmart' THEN '/images/portfolio/surfsmart.webp'
    WHEN 'twilight-zone' THEN '/images/portfolio/twilight-zone.webp'
    WHEN 'portfolio-site' THEN '/images/portfolio/portfolio-site.webp'
    ELSE image_url
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE slug IN (
  'citeai', 'gworkspace', 'oceannect', 'vana', 'farivy', 'oceanseo',
  'moblify', 'personal-resume', 'surfsmart', 'twilight-zone', 'portfolio-site'
)
  AND NOT EXISTS (
    SELECT 1 FROM resume_content_revisions WHERE revision_id = '2026-09-portfolio-media-refresh'
  );

INSERT OR IGNORE INTO resume_content_revisions (revision_id, applied_at)
VALUES ('2026-09-portfolio-media-refresh', CURRENT_TIMESTAMP);
