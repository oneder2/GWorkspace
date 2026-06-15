<template>
  <div class="workspace-page animate-fade-in">
    <div class="workspace-shell">
      <section class="workspace-command surface-panel shadow-lg">
        <div class="workspace-command-copy">
          <span class="workspace-eyebrow">{{ $t('tools.workspace.heroEyebrow') }}</span>
          <h1 class="workspace-title">{{ $t('tools.title') }}</h1>
          <p class="workspace-description">{{ $t('tools.workspace.heroDescription') }}</p>
        </div>

        <div class="workspace-command-actions">
          <label class="workspace-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle>
              <path d="m20 20-3.5-3.5"></path>
            </svg>
            <input
              ref="searchInputRef"
              v-model.trim="searchQuery"
              type="search"
              :placeholder="$t('workspace.searchPlaceholder')"
              @keydown.down.prevent="moveActiveSearchResult(1)"
              @keydown.up.prevent="moveActiveSearchResult(-1)"
              @keydown.enter.prevent="confirmActiveSearchResult"
              @keydown.esc.prevent="clearSearch"
            >
            <span class="workspace-search-shortcuts" aria-hidden="true">
              <kbd>/</kbd>
              <kbd>⌘K</kbd>
            </span>
            <span class="workspace-search-count">{{ searchMetaLabel }}</span>
          </label>

          <div class="workspace-filter-row">
            <button
              v-for="mode in filterModes"
              :key="mode.id"
              type="button"
              class="workspace-filter-chip"
              :class="{ 'is-active': activeFilter === mode.id }"
              @click="activeFilter = mode.id"
            >
              {{ mode.label }}
            </button>
          </div>
        </div>
      </section>

      <section v-if="!activeToolData && hasSearchQuery" class="workspace-search-panel surface-panel shadow-lg">
        <div class="workspace-section-head">
          <div>
            <h2 class="workspace-section-title">{{ $t('workspace.searchResultsTitle') }}</h2>
            <p class="workspace-section-copy">{{ $t('workspace.searchResultsDescription') }}</p>
          </div>
          <span class="workspace-section-badge">{{ searchResults.length }}</span>
        </div>

        <div v-if="searchResults.length" class="workspace-result-command" role="listbox">
          <section
            v-for="group in searchResultGroups"
            :key="group.id"
            class="workspace-result-group"
          >
            <div class="workspace-result-group-head">
              <span>{{ group.label }}</span>
              <span>{{ group.entries.length }}</span>
            </div>

            <div class="workspace-result-list">
              <button
                v-for="entry in group.entries"
                :key="`${entry.kind}-${entry.id}`"
                type="button"
                class="workspace-result-card"
                :class="{ 'is-disabled': entry.disabled, 'is-active': isActiveSearchEntry(entry) }"
                role="option"
                :aria-selected="isActiveSearchEntry(entry)"
                @mouseenter="setActiveSearchEntry(entry)"
                @click="activateEntry(entry)"
              >
                <span class="workspace-entry-icon">
                  <component :is="entry.icon" class="w-4 h-4" />
                </span>
                <span class="workspace-result-body">
                  <span class="workspace-result-title-row">
                    <span class="workspace-result-title">{{ entry.name }}</span>
                    <span class="workspace-recent-type">{{ entry.kindLabel }}</span>
                  </span>
                  <span class="workspace-result-copy">{{ entry.description }}</span>
                </span>
                <svg v-if="!entry.disabled" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" class="workspace-link-arrow">
                  <path d="M7 17 17 7"></path>
                  <path d="M9 7h8v8"></path>
                </svg>
              </button>
            </div>
          </section>

          <div class="workspace-command-hints" aria-hidden="true">
            <span>↑↓ {{ $t('workspace.keyboardNavigate') }}</span>
            <span>Enter {{ $t('workspace.keyboardOpen') }}</span>
            <span>Esc {{ $t('workspace.keyboardClear') }}</span>
          </div>
        </div>

        <p v-else class="workspace-empty-copy">{{ $t('workspace.noSearchResults') }}</p>
      </section>

      <section v-else-if="!activeToolData" class="workspace-overview">
        <div class="workspace-main-column">
          <section class="workspace-card workspace-card-launch surface-panel shadow-lg">
            <div class="workspace-section-head">
              <div>
                <h2 class="workspace-section-title">{{ $t('tools.workspace.quickLaunchTitle') }}</h2>
                <p class="workspace-section-copy">{{ $t('tools.workspace.quickLaunchDescription') }}</p>
              </div>
              <span class="workspace-section-badge">{{ quickLaunchEntries.length }}</span>
            </div>

            <div class="workspace-launch-grid">
              <button
                v-for="entry in quickLaunchEntries"
                :key="`${entry.kind}-${entry.id}`"
                type="button"
                class="workspace-launch-card"
                @click="activateEntry(entry)"
              >
                <span class="workspace-entry-icon workspace-entry-icon-strong">
                  <component :is="entry.icon" class="w-5 h-5" />
                </span>
                <span class="workspace-launch-name">{{ entry.name }}</span>
                <span class="workspace-launch-meta">{{ entry.kindLabel }}</span>
              </button>
            </div>
          </section>

          <section class="workspace-card workspace-card-tools surface-panel shadow-lg">
            <div class="workspace-section-head">
              <div>
                <h2 class="workspace-section-title">{{ $t('tools.workspace.coreTitle') }}</h2>
                <p class="workspace-section-copy">{{ $t('tools.workspace.coreDescription') }}</p>
              </div>
              <span class="workspace-section-badge">{{ visibleTools.length }}</span>
            </div>

            <div class="workspace-tool-grid">
              <button
                v-for="tool in visibleTools"
                :key="tool.id"
                type="button"
                class="workspace-tool-card"
                :class="{ 'is-disabled': tool.disabled }"
                @click="openTool(tool.id)"
              >
                <div class="workspace-tool-head">
                  <span class="workspace-entry-icon workspace-entry-icon-strong">
                    <component :is="tool.icon" class="w-5 h-5" />
                  </span>
                  <div class="workspace-tool-meta">
                    <div class="workspace-tool-title-row">
                      <span class="workspace-tool-title">{{ tool.name }}</span>
                      <span v-if="tool.badge" class="workspace-entry-badge">{{ tool.badge }}</span>
                    </div>
                    <span class="workspace-tool-label">{{ tool.categoryLabel }}</span>
                  </div>
                </div>
                <p class="workspace-tool-copy">{{ tool.description }}</p>
              </button>
            </div>
          </section>

          <section class="workspace-card workspace-card-external surface-panel shadow-lg">
            <div class="workspace-section-head">
              <div>
                <h2 class="workspace-section-title">{{ $t('workspace.externalTitle') }}</h2>
                <p class="workspace-section-copy">{{ $t('workspace.externalDescription') }}</p>
              </div>
              <span class="workspace-section-badge">{{ filteredExternalGroups.length }}</span>
            </div>

            <div v-if="filteredExternalGroups.length" class="workspace-resource-grid">
              <section
                v-for="group in filteredExternalGroups"
                :key="group.id"
                class="workspace-resource-group"
              >
                <div class="workspace-group-head">
                  <div class="workspace-group-title-row">
                    <span class="workspace-entry-icon">
                      <component :is="group.icon" class="w-4 h-4" />
                    </span>
                    <div>
                      <h3 class="workspace-group-title">{{ group.name }}</h3>
                      <p class="workspace-group-copy">{{ group.description }}</p>
                    </div>
                  </div>
                </div>

                <div class="workspace-link-list">
                  <a
                    v-for="link in group.links"
                    :key="link.id"
                    :href="link.url"
                    target="_blank"
                    rel="noreferrer"
                    class="workspace-link-row"
                    @click="trackExternalVisit(link)"
                  >
                    <span class="workspace-link-title">{{ link.title }}</span>
                    <span class="workspace-link-copy">{{ link.description }}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" class="workspace-link-arrow">
                      <path d="M7 17 17 7"></path>
                      <path d="M9 7h8v8"></path>
                    </svg>
                  </a>
                </div>
              </section>
            </div>

            <p v-else class="workspace-empty-copy">{{ $t('workspace.emptyExternal') }}</p>
          </section>
        </div>

        <aside class="workspace-side-column">
          <section class="workspace-card workspace-card-recent surface-panel shadow-lg">
            <div class="workspace-section-head workspace-section-head-compact">
              <div>
                <h2 class="workspace-section-title">{{ $t('tools.workspace.recentTitle') }}</h2>
                <p class="workspace-section-copy">{{ $t('tools.workspace.recentDescription') }}</p>
              </div>
              <span class="workspace-section-badge">{{ recentEntries.length }}</span>
            </div>

            <div v-if="recentEntries.length" class="workspace-recent-list">
              <button
                v-for="entry in recentEntries"
                :key="`${entry.kind}-${entry.id}`"
                type="button"
                class="workspace-recent-card"
                @click="activateEntry(entry)"
              >
                <span class="workspace-recent-top">
                  <span class="workspace-entry-icon">
                    <component :is="entry.icon" class="w-4 h-4" />
                  </span>
                  <span class="workspace-recent-type">{{ entry.kindLabel }}</span>
                </span>
                <span class="workspace-recent-name">{{ entry.name }}</span>
              </button>
            </div>

            <p v-else class="workspace-empty-copy">{{ $t('tools.workspace.recentEmpty') }}</p>
          </section>

          <section class="workspace-card workspace-card-lab surface-panel shadow-lg">
            <span class="workspace-lab-kicker">{{ $t('tools.workspace.labKicker') }}</span>
            <h2 class="workspace-section-title">{{ $t('tools.workspace.labTitle') }}</h2>
            <p class="workspace-section-copy">{{ $t('tools.workspace.labDescription') }}</p>
            <button
              v-if="labTool"
              type="button"
              class="workspace-lab-card"
              disabled
            >
              <span class="workspace-entry-icon workspace-entry-icon-strong">
                <component :is="labTool.icon" class="w-5 h-5" />
              </span>
              <span>
                <span class="workspace-tool-title">{{ labTool.name }}</span>
                <span class="workspace-tool-copy">{{ labTool.description }}</span>
              </span>
              <span class="workspace-entry-badge">{{ labTool.badge }}</span>
            </button>
          </section>
        </aside>
      </section>

      <section
        v-else
        ref="workspaceRef"
        class="workspace-tool-surface surface-panel rounded-[32px] shadow-lg overflow-hidden"
      >
        <div class="workspace-tool-shell">
          <div class="workspace-tool-toolbar">
            <button
              type="button"
              class="workspace-back-btn"
              @click="closeToolView"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
                <path d="m15 18-6-6 6-6"></path>
              </svg>
              <span>{{ $t('tools.workspace.backToOverview') }}</span>
            </button>

            <div class="workspace-tool-summary">
              <span class="workspace-tool-label">{{ activeToolData.categoryLabel }}</span>
              <h2 class="workspace-tool-heading">{{ activeToolData.name }}</h2>
            </div>
          </div>

          <div :class="['workspace-tool-body', workspacePaddingClass, workspaceScrollClass]">
            <component :is="activeToolComponent" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import BlogAssistantTool from '../components/tools/BlogAssistantTool.vue'
import CalculatorTool from '../components/tools/CalculatorTool.vue'
import EncoderTool from '../components/tools/EncoderTool.vue'
import JsonTool from '../components/tools/JsonTool.vue'
import MarkdownTool from '../components/tools/MarkdownTool.vue'
import ThesisParserTool from '../components/tools/ThesisParserTool.vue'
import TimeSuiteTool from '../components/tools/TimeSuiteTool.vue'
import { useLocalStorage } from '../composables/useStorage'
import { sitesConfig } from '../config/sites'
import { toolsConfig } from '../config/tools'
import { getIcon } from '../utils/iconMapper'

const toolComponentMap = {
  'blog-assistant': BlogAssistantTool,
  calculator: CalculatorTool,
  encoder: EncoderTool,
  json: JsonTool,
  markdown: MarkdownTool,
  'thesis-parser': ThesisParserTool,
  'time-suite': TimeSuiteTool
}

const scrollableToolIds = new Set(['blog-assistant', 'calculator', 'encoder', 'json', 'markdown', 'thesis-parser', 'time-suite'])
const executableToolIds = new Set(toolsConfig.filter((tool) => !tool.disabled).map((tool) => tool.id))

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const workspaceRef = ref(null)
const searchInputRef = ref(null)
const activeToolId = ref(null)
const activeFilter = ref('all')
const searchQuery = ref('')
const activeSearchIndex = ref(0)

const { value: recentEntriesStore } = useLocalStorage('workspace-recent-entries', [])
const { value: lastActiveToolId } = useLocalStorage('workspace-last-tool', '')

const filterModes = computed(() => [
  { id: 'all', label: t('workspace.filters.all') },
  { id: 'internal', label: t('workspace.filters.internal') },
  { id: 'external', label: t('workspace.filters.external') }
])

const normalizedQuery = computed(() => searchQuery.value.trim().toLowerCase())
const hasSearchQuery = computed(() => normalizedQuery.value.length > 0)

const tools = computed(() => toolsConfig.map((tool) => ({
  ...tool,
  kind: 'tool',
  name: t(tool.nameKey),
  description: t(tool.descriptionKey),
  badge: tool.badgeKey ? t(tool.badgeKey) : '',
  icon: getIcon(tool.iconName),
  categoryLabel: t(tool.categoryKey),
  kindLabel: t('workspace.entryKinds.internal')
})))

const toolMap = computed(() => Object.fromEntries(tools.value.map((tool) => [tool.id, tool])))

const externalGroups = computed(() => sitesConfig.map((group) => ({
  ...group,
  name: t(group.nameKey),
  description: t(group.descriptionKey),
  icon: getIcon(group.iconName),
  links: group.links.map((link) => ({
    ...link,
    kind: 'external',
    name: link.title,
    description: t(link.descKey),
    icon: getIcon(group.iconName),
    kindLabel: t('workspace.entryKinds.external')
  }))
})))

const externalEntries = computed(() => externalGroups.value.flatMap((group) => group.links))
const visibleTools = computed(() => filteredTools.value.filter((tool) => tool.workspaceGroup !== 'lab'))
const labTool = computed(() => tools.value.find((tool) => tool.workspaceGroup === 'lab'))

const filteredTools = computed(() => {
  if (activeFilter.value === 'external') return []

  return tools.value.filter((tool) => matchesQuery(tool, [
    tool.name,
    tool.description,
    tool.categoryLabel,
    ...(tool.keywords || [])
  ]))
})

const filteredExternalGroups = computed(() => {
  if (activeFilter.value === 'internal') return []

  return externalGroups.value
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => matchesQuery(link, [
        link.title,
        link.description,
        ...(link.tags || [])
      ]))
    }))
    .filter((group) => group.links.length > 0)
})

const quickLaunchEntries = computed(() => {
  const preferredIds = ['chatgpt', 'github', 'openai-api', 'vercel', 'cloudflare', 'json', 'encoder', 'time-suite']
  const entryMap = new Map([
    ...tools.value.map((tool) => [tool.id, tool]),
    ...externalEntries.value.map((entry) => [entry.id, entry])
  ])

  return preferredIds
    .map((id) => entryMap.get(id))
    .filter(Boolean)
    .filter((entry) => activeFilter.value === 'all' || (activeFilter.value === 'internal' ? entry.kind === 'tool' : entry.kind === 'external'))
})

const recentEntries = computed(() => sanitizeRecentEntries(recentEntriesStore.value)
  .map((entry) => resolveEntry(entry))
  .filter(Boolean))

const searchResults = computed(() => [
  ...filteredTools.value,
  ...filteredExternalGroups.value.flatMap((group) => group.links)
])

const searchResultGroups = computed(() => [
  {
    id: 'internal',
    label: t('workspace.searchGroups.internal'),
    entries: filteredTools.value
  },
  {
    id: 'external',
    label: t('workspace.searchGroups.external'),
    entries: filteredExternalGroups.value.flatMap((group) => group.links)
  }
].filter((group) => group.entries.length > 0))

const searchMetaLabel = computed(() => {
  const count = hasSearchQuery.value ? searchResults.value.length : quickLaunchEntries.value.length
  return t('workspace.searchMeta', { count })
})

const activeSearchEntry = computed(() => searchResults.value[activeSearchIndex.value] || null)

const activeToolData = computed(() => {
  const normalizedId = normalizeToolId(activeToolId.value)
  return normalizedId ? toolMap.value[normalizedId] : null
})

const activeToolComponent = computed(() => (
  activeToolData.value ? toolComponentMap[activeToolData.value.id] || null : null
))

const workspacePaddingClass = computed(() => (
  activeToolData.value?.workspacePadding === 'compact'
    ? 'workspace-tool-body-compact'
    : 'workspace-tool-body-default'
))

const workspaceScrollClass = computed(() => (
  scrollableToolIds.has(activeToolData.value?.id)
    ? 'workspace-tool-body-scroll'
    : 'workspace-tool-body-static'
))

watch(
  [() => route.query.tool, () => lastActiveToolId.value],
  ([toolQuery]) => {
    const routeToolId = normalizeToolId(toolQuery)
    if (!routeToolId && toolQuery) {
      const nextQuery = { ...route.query }
      delete nextQuery.tool
      router.replace({ query: nextQuery })
      return
    }

    activeToolId.value = routeToolId || null
  },
  { immediate: true }
)

watch(activeToolId, (toolId) => {
  const normalizedId = normalizeToolId(toolId)
  const currentRouteTool = normalizeToolId(route.query.tool)

  if (!normalizedId) {
    if (route.query.tool) {
      const nextQuery = { ...route.query }
      delete nextQuery.tool
      router.replace({ query: nextQuery })
    }
    return
  }

  lastActiveToolId.value = normalizedId

  if (normalizedId === currentRouteTool) {
    return
  }

  router.replace({
    query: {
      ...route.query,
      tool: normalizedId
    }
  })
})

watch([searchResults, normalizedQuery, () => activeFilter.value], () => {
  activeSearchIndex.value = 0
})

onMounted(() => {
  window.addEventListener('keydown', handleGlobalSearchShortcut)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalSearchShortcut)
})

function matchesQuery(entry, fields) {
  if (!normalizedQuery.value) return true
  return fields.join(' ').toLowerCase().includes(normalizedQuery.value)
}

function getEntryKey(entry) {
  return entry ? `${entry.kind}-${entry.id}` : ''
}

function isActiveSearchEntry(entry) {
  return getEntryKey(entry) === getEntryKey(activeSearchEntry.value)
}

function setActiveSearchEntry(entry) {
  const nextIndex = searchResults.value.findIndex((item) => getEntryKey(item) === getEntryKey(entry))
  if (nextIndex >= 0) {
    activeSearchIndex.value = nextIndex
  }
}

function moveActiveSearchResult(direction) {
  if (!hasSearchQuery.value || searchResults.value.length === 0) return
  const resultCount = searchResults.value.length
  activeSearchIndex.value = (activeSearchIndex.value + direction + resultCount) % resultCount
}

function confirmActiveSearchResult() {
  if (!hasSearchQuery.value) return
  activateEntry(activeSearchEntry.value)
}

function clearSearch() {
  if (!hasSearchQuery.value) return
  searchQuery.value = ''
  activeSearchIndex.value = 0
  searchInputRef.value?.blur()
}

function handleGlobalSearchShortcut(event) {
  if (activeToolData.value || isTypingTarget(event.target)) return

  const isCommandK = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)
  const isSlash = event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey

  if (!isCommandK && !isSlash) return

  event.preventDefault()
  searchInputRef.value?.focus()
  searchInputRef.value?.select()
}

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false
  const tagName = target.tagName.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable
}

function normalizeToolId(toolId) {
  const nextId = Array.isArray(toolId) ? toolId[0] : toolId
  return typeof nextId === 'string' && executableToolIds.has(nextId) ? nextId : null
}

function sanitizeRecentEntries(value) {
  if (!Array.isArray(value)) return []
  return value.filter((entry) => (
    entry &&
    typeof entry.id === 'string' &&
    (entry.kind === 'tool' || entry.kind === 'external')
  )).slice(0, 8)
}

function resolveEntry(entry) {
  if (entry.kind === 'tool') {
    const tool = toolMap.value[entry.id]
    if (!tool || tool.disabled) return null
    return tool
  }

  const external = externalEntries.value.find((item) => item.id === entry.id)
  return external || null
}

function rememberEntry(entry) {
  if (entry.disabled) return

  const next = {
    id: entry.id,
    kind: entry.kind
  }

  recentEntriesStore.value = [
    next,
    ...sanitizeRecentEntries(recentEntriesStore.value).filter((item) => !(item.id === next.id && item.kind === next.kind))
  ].slice(0, 8)
}

async function openTool(toolId) {
  const normalizedId = normalizeToolId(toolId)
  if (!normalizedId) return

  const tool = toolMap.value[normalizedId]
  if (!tool || tool.disabled) return

  rememberEntry(tool)
  activeToolId.value = normalizedId

  await nextTick()

  if (typeof window !== 'undefined' && window.innerWidth < 1280) {
    workspaceRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function closeToolView() {
  activeToolId.value = null
}

function trackExternalVisit(link) {
  rememberEntry(link)
}

function activateEntry(entry) {
  if (!entry || entry.disabled) return

  if (entry.kind === 'tool') {
    openTool(entry.id)
    return
  }

  trackExternalVisit(entry)
  window.open(entry.url, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
@import '../styles/pages/ToolsPage.css';
</style>
