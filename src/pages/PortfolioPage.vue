<template>
  <div class="portfolio-page animate-fade-in">
    <header class="portfolio-intro">
      <div class="portfolio-intro__copy">
        <span class="portfolio-kicker">{{ $t('portfolio.eyebrow') }}</span>
        <h1>{{ $t('portfolio.title') }}</h1>
        <p>{{ $t('portfolio.subtitle') }}</p>
      </div>

      <dl class="portfolio-index" :aria-label="$t('portfolio.indexLabel')">
        <div>
          <dt>{{ $t('portfolio.projectCount') }}</dt>
          <dd>{{ portfolio.length.toString().padStart(2, '0') }}</dd>
        </div>
        <div>
          <dt>{{ $t('portfolio.focusLabel') }}</dt>
          <dd>{{ $t('portfolio.focusValue') }}</dd>
        </div>
      </dl>
    </header>

    <section class="selected-work" :aria-label="$t('portfolio.selectedTitle')">
      <header class="section-heading">
        <div>
          <span>01</span>
          <h2>{{ $t('portfolio.selectedTitle') }}</h2>
        </div>
        <p>{{ $t('portfolio.selectedIntro') }}</p>
      </header>

      <article
        v-for="(work, index) in leadProjects"
        :id="`project-${work.slug}`"
        :key="work.slug || work.title"
        class="featured-case"
      >
        <a
          :href="work.url"
          :target="isExternal(work.url) ? '_blank' : undefined"
          :rel="isExternal(work.url) ? 'noopener noreferrer' : undefined"
          class="project-stage"
          :aria-label="work.title"
        >
          <img
            v-if="work.image"
            :src="work.image"
            :alt="work.title"
            :loading="index === 0 ? 'eager' : 'lazy'"
          />
          <div v-else class="project-monogram" aria-hidden="true">
            <component :is="work.icon" />
            <span>{{ projectMonogram(work.slug || work.title) }}</span>
          </div>
          <span class="project-number">{{ projectNumber(work) }}</span>
          <span v-if="work.featured" class="project-status">{{ $t('portfolio.featured') }}</span>
        </a>

        <div class="featured-case__body">
          <div class="project-meta">
            <span>{{ work.role || $t('portfolio.defaultRole') }}</span>
            <time>{{ formatPeriod(work.start, work.end) }}</time>
          </div>

          <h3>{{ work.title }}</h3>
          <p class="project-summary">{{ work.desc }}</p>

          <ul v-if="work.highlights?.length" class="project-highlights">
            <li v-for="highlight in work.highlights.slice(0, 2)" :key="highlight">
              {{ highlight }}
            </li>
          </ul>

          <div class="project-footer">
            <div class="project-technologies" aria-label="Technologies">
              <span v-for="technology in evidenceTechnologies(work)" :key="technology">
                {{ technology }}
              </span>
            </div>
            <a
              :href="work.url"
              :target="isExternal(work.url) ? '_blank' : undefined"
              :rel="isExternal(work.url) ? 'noopener noreferrer' : undefined"
              class="project-action"
            >
              {{ $t('portfolio.viewProject') }}
              <component :is="linkIcon" aria-hidden="true" />
            </a>
          </div>
        </div>
      </article>
    </section>

    <section v-if="indexProjects.length" class="project-archive" :aria-label="$t('portfolio.archiveTitle')">
      <header class="section-heading">
        <div>
          <span>02</span>
          <h2>{{ $t('portfolio.archiveTitle') }}</h2>
        </div>
        <p>{{ $t('portfolio.archiveIntro') }}</p>
      </header>

      <div class="archive-grid">
        <article v-for="work in indexProjects" :key="work.slug || work.title" class="archive-card">
          <a
            :href="work.url"
            :target="isExternal(work.url) ? '_blank' : undefined"
            :rel="isExternal(work.url) ? 'noopener noreferrer' : undefined"
            class="archive-card__visual"
            :aria-label="work.title"
          >
            <img v-if="work.image" :src="work.image" :alt="work.title" loading="lazy" />
            <div v-else class="project-monogram" aria-hidden="true">
              <component :is="work.icon" />
              <span>{{ projectMonogram(work.slug || work.title) }}</span>
            </div>
            <span class="project-number">{{ projectNumber(work) }}</span>
          </a>

          <div class="archive-card__body">
            <div class="project-meta">
              <span>{{ work.role || $t('portfolio.defaultRole') }}</span>
              <time>{{ formatPeriod(work.start, work.end) }}</time>
            </div>
            <h3>{{ work.title }}</h3>
            <p class="project-summary">{{ work.desc }}</p>
            <div class="archive-card__footer">
              <div class="project-technologies" aria-label="Technologies">
                <span v-for="technology in evidenceTechnologies(work, 4)" :key="technology">
                  {{ technology }}
                </span>
              </div>
              <a
                :href="work.url"
                :target="isExternal(work.url) ? '_blank' : undefined"
                :rel="isExternal(work.url) ? 'noopener noreferrer' : undefined"
                class="icon-link"
                :aria-label="`${$t('portfolio.viewProject')}: ${work.title}`"
                :title="$t('portfolio.viewProject')"
              >
                <component :is="linkIcon" aria-hidden="true" />
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { portfolioConfig, portfolioImages } from '../config/portfolio'
import { getIcon } from '../utils/iconMapper'
import { publicContentApi } from '../utils/api'

const LEAD_PROJECTS = ['citeai', 'gworkspace', 'oceannect']

const { t, locale } = useI18n()
const remoteProjects = ref(null)
const linkIcon = getIcon('LinkIcon')
const contentLocale = computed(() => String(locale.value || 'zh').toLowerCase().startsWith('zh') ? 'zh' : 'en')

const loadProjects = async () => {
  try {
    remoteProjects.value = await publicContentApi.getProjects(contentLocale.value)
  } catch {
    remoteProjects.value = null
  }
}

const portfolio = computed(() => {
  if (Array.isArray(remoteProjects.value) && remoteProjects.value.length) {
    return remoteProjects.value.map(work => ({
      ...work,
      desc: work.summary,
      image: work.image || portfolioImages[work.slug] || null,
      technologies: Array.isArray(work.technologies) ? work.technologies : work.tags,
      highlights: Array.isArray(work.highlights) ? work.highlights : [],
      icon: getIcon('LayoutIcon')
    }))
  }

  return portfolioConfig.map(work => ({
    ...work,
    title: t(work.titleKey),
    desc: t(work.descKey),
    role: t(work.roleKey),
    highlights: work.highlightKeys.map(key => t(key)),
    icon: getIcon(work.iconName)
  }))
})

const leadProjects = computed(() => (
  LEAD_PROJECTS
    .map(slug => portfolio.value.find(work => work.slug === slug))
    .filter(Boolean)
))

const indexProjects = computed(() => (
  portfolio.value.filter(work => !LEAD_PROJECTS.includes(work.slug))
))

const isExternal = (url) => /^https?:\/\//i.test(String(url || ''))

const formatPeriod = (start, end) => {
  if (!start) return t('portfolio.dateUnavailable')
  return `${start} - ${end || t('portfolio.present')}`
}

const evidenceTechnologies = (work, limit = 6) => {
  const source = work.technologies?.length ? work.technologies : work.tags
  return Array.isArray(source) ? source.slice(0, limit) : []
}

const projectNumber = (work) => {
  const index = portfolio.value.findIndex(candidate => candidate.slug === work.slug)
  return String(index + 1).padStart(2, '0')
}

const projectMonogram = (value) => {
  const text = String(value || '')
  const ascii = text.replace(/[^a-z0-9]/gi, '')
  return (ascii || text).slice(0, 2).toUpperCase()
}

onMounted(loadProjects)
watch(contentLocale, loadProjects)
</script>

<style scoped>
.portfolio-page {
  --portfolio-paper: color-mix(in srgb, var(--surface-card-bg, white) 94%, transparent);
  --portfolio-rule: color-mix(in srgb, var(--text-main) 16%, transparent);
  --portfolio-signal: #c6533f;
  --portfolio-teal: #26766a;
  width: min(100%, 1240px);
  margin: 0 auto;
  padding: 0.75rem 0 3rem;
}

.portfolio-intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 22rem;
  gap: 3.5rem;
  align-items: end;
  padding: 2.5rem 0.5rem 2rem;
}

.portfolio-kicker {
  display: inline-flex;
  gap: 0.65rem;
  align-items: center;
  color: var(--portfolio-signal);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.portfolio-kicker::before {
  width: 2.25rem;
  height: 2px;
  background: currentColor;
  content: '';
}

.portfolio-intro h1 {
  max-width: 17ch;
  margin: 0.65rem 0 0;
  color: var(--text-main);
  font-family: Georgia, 'Noto Serif SC', serif;
  font-size: 3.6rem;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: 0;
}

.portfolio-intro__copy > p {
  max-width: 47rem;
  margin: 1rem 0 0;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.7;
}

.portfolio-index {
  display: grid;
  grid-template-columns: 0.7fr 1.3fr;
  margin: 0;
  border-top: 2px solid var(--portfolio-teal);
}

.portfolio-index > div {
  min-width: 0;
  padding: 0.9rem 0.8rem 0;
}

.portfolio-index > div + div {
  border-left: 1px solid var(--portfolio-rule);
}

.portfolio-index dt {
  color: var(--text-muted);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.portfolio-index dd {
  margin: 0.3rem 0 0;
  color: var(--text-main);
  font-family: Georgia, 'Noto Serif SC', serif;
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.25;
}

.selected-work,
.project-archive {
  padding: 0 0.5rem;
}

.section-heading {
  display: grid;
  grid-template-columns: minmax(15rem, 0.75fr) minmax(0, 1.25fr);
  gap: 2rem;
  align-items: end;
  padding: 1rem 0 0.9rem;
  border-top: 1px solid var(--portfolio-rule);
}

.section-heading > div {
  display: flex;
  gap: 0.8rem;
  align-items: baseline;
}

.section-heading span {
  color: var(--portfolio-signal);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.68rem;
  font-weight: 800;
}

.section-heading h2 {
  margin: 0;
  color: var(--text-main);
  font-family: Georgia, 'Noto Serif SC', serif;
  font-size: 1.7rem;
  letter-spacing: 0;
}

.section-heading p {
  max-width: 40rem;
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.86rem;
  line-height: 1.55;
}

.featured-case {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(19rem, 0.8fr);
  gap: 2rem;
  align-items: center;
  padding: 1.9rem 0;
  border-top: 1px solid var(--portfolio-rule);
}

.project-stage,
.archive-card__visual {
  position: relative;
  display: block;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: #dfe6e2;
  border: 1px solid var(--portfolio-rule);
  border-radius: 4px;
}

.project-stage img,
.archive-card__visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 420ms ease;
}

.project-stage:hover img,
.archive-card__visual:hover img {
  transform: scale(1.012);
}

.project-stage:focus-visible,
.archive-card__visual:focus-visible,
.project-action:focus-visible,
.icon-link:focus-visible {
  outline: 3px solid var(--theme-primary, #22c55e);
  outline-offset: 3px;
}

.project-number,
.project-status {
  position: absolute;
  top: 0.75rem;
  padding: 0.35rem 0.5rem;
  background: rgba(20, 34, 38, 0.88);
  color: #fff;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.66rem;
  font-weight: 800;
}

.project-number {
  left: 0.75rem;
}

.project-status {
  right: 0.75rem;
}

.featured-case__body {
  min-width: 0;
}

.project-meta {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  justify-content: space-between;
  color: var(--text-muted);
  font-size: 0.68rem;
  line-height: 1.45;
}

.project-meta span {
  color: var(--portfolio-signal);
  font-weight: 800;
}

.project-meta time {
  flex: 0 0 auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.featured-case h3,
.archive-card h3 {
  overflow-wrap: anywhere;
  color: var(--text-main);
  font-family: Georgia, 'Noto Serif SC', serif;
  letter-spacing: 0;
}

.featured-case h3 {
  margin: 0.7rem 0 0;
  font-size: 1.9rem;
  line-height: 1.16;
}

.project-summary {
  color: var(--text-secondary);
}

.featured-case .project-summary {
  margin: 1rem 0 0;
  font-size: 0.92rem;
  line-height: 1.65;
}

.project-highlights {
  display: grid;
  gap: 0.65rem;
  margin: 1.15rem 0 0;
  padding: 0 0 0 1rem;
  border-left: 2px solid var(--portfolio-teal);
  list-style: none;
}

.project-highlights li {
  color: var(--text-secondary);
  font-size: 0.78rem;
  line-height: 1.55;
}

.project-footer {
  display: grid;
  gap: 1.1rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--portfolio-rule);
}

.project-technologies {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0;
}

.project-technologies span {
  color: var(--text-main);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.65rem;
  font-weight: 700;
}

.project-technologies span:not(:last-child)::after {
  margin: 0 0.55rem;
  color: var(--portfolio-signal);
  content: '/';
}

.project-action {
  display: inline-flex;
  width: fit-content;
  gap: 0.45rem;
  align-items: center;
  color: var(--portfolio-teal);
  font-size: 0.78rem;
  font-weight: 800;
  text-decoration: none;
}

.project-action svg {
  width: 1rem;
  height: 1rem;
  transition: transform 180ms ease;
}

.project-action:hover svg {
  transform: translate(2px, -2px);
}

.project-archive {
  margin-top: 2.25rem;
}

.archive-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
  padding-top: 0.5rem;
}

.archive-card {
  min-width: 0;
  overflow: hidden;
  background: var(--portfolio-paper);
  border: 1px solid var(--portfolio-rule);
  border-radius: 4px;
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.archive-card:hover {
  border-color: color-mix(in srgb, var(--portfolio-teal) 55%, var(--portfolio-rule));
  box-shadow: 0 16px 38px rgba(23, 39, 44, 0.12);
  transform: translateY(-2px);
}

.archive-card__visual {
  border: 0;
  border-bottom: 1px solid var(--portfolio-rule);
  border-radius: 0;
}

.archive-card__body {
  display: flex;
  min-height: 14.5rem;
  flex-direction: column;
  padding: 1.2rem;
}

.archive-card h3 {
  margin: 0.55rem 0 0;
  font-size: 1.25rem;
  line-height: 1.22;
}

.archive-card .project-summary {
  display: -webkit-box;
  margin: 0.75rem 0 0;
  overflow: hidden;
  font-size: 0.82rem;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.archive-card__footer {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 1rem;
}

.icon-link {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--portfolio-rule);
  border-radius: 4px;
  color: var(--portfolio-teal);
  text-decoration: none;
}

.icon-link:hover {
  background: color-mix(in srgb, var(--portfolio-teal) 9%, transparent);
  border-color: var(--portfolio-teal);
}

.icon-link svg {
  width: 1rem;
  height: 1rem;
}

.project-monogram {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  background: #dce5e1;
  color: #235f57;
}

.project-monogram svg {
  width: 2rem;
  height: 2rem;
}

.project-monogram span {
  display: none;
}

:global(.dark) .portfolio-page {
  --portfolio-paper: rgba(10, 23, 28, 0.88);
  --portfolio-rule: rgba(203, 219, 220, 0.17);
  --portfolio-signal: #ec8a72;
  --portfolio-teal: #66b9aa;
}

:global(.dark) .project-monogram {
  background: #18312f;
  color: #8fd4c8;
}

@media (max-width: 1050px) {
  .portfolio-intro {
    grid-template-columns: minmax(0, 1fr) 18rem;
    gap: 2rem;
  }

  .portfolio-intro h1 {
    font-size: 3rem;
  }

  .featured-case {
    grid-template-columns: minmax(0, 1.2fr) minmax(18rem, 0.8fr);
    gap: 1.5rem;
  }
}

@media (max-width: 820px) {
  .portfolio-intro,
  .section-heading,
  .featured-case {
    grid-template-columns: 1fr;
  }

  .portfolio-intro {
    gap: 1.75rem;
  }

  .portfolio-index {
    max-width: 24rem;
  }

  .section-heading {
    gap: 0.5rem;
  }

  .featured-case {
    gap: 1.2rem;
  }
}

@media (max-width: 620px) {
  .portfolio-page {
    padding-top: 0;
  }

  .portfolio-intro {
    padding: 1.4rem 0.15rem 1.75rem;
  }

  .portfolio-intro h1 {
    font-size: 2.25rem;
  }

  .portfolio-intro__copy > p {
    font-size: 0.9rem;
  }

  .selected-work,
  .project-archive {
    padding: 0 0.15rem;
  }

  .featured-case {
    padding: 1.35rem 0 1.65rem;
  }

  .featured-case h3 {
    font-size: 1.55rem;
  }

  .archive-grid {
    grid-template-columns: 1fr;
  }

  .archive-card__body {
    min-height: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-stage img,
  .archive-card,
  .archive-card__visual img,
  .project-action svg {
    transition: none;
  }
}
</style>
