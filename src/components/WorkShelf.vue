<template>
  <footer class="work-shelf" :aria-label="$t('workShelf.label')">
    <div class="work-shelf-room">
      <span class="work-shelf-room-mark" aria-hidden="true"></span>
      <span class="work-shelf-room-copy">
        <span class="work-shelf-kicker">{{ $t('workShelf.location') }}</span>
        <strong>{{ currentRoomLabel }}</strong>
      </span>
    </div>

    <div class="work-shelf-activity">
      <span class="work-shelf-kicker work-shelf-activity-label">{{ $t('workShelf.recent') }}</span>
      <div v-if="recentItems.length" class="work-shelf-items">
        <button
          v-for="item in recentItems"
          :key="`${item.kind}-${item.id}`"
          type="button"
          class="work-shelf-item"
          :title="$t('workShelf.resumeItem', { name: item.name })"
          @click="activateItem(item)"
        >
          <component :is="item.icon" class="work-shelf-item-icon" aria-hidden="true" />
          <span>{{ item.name }}</span>
        </button>
      </div>
      <span v-else class="work-shelf-empty">{{ $t('workShelf.empty') }}</span>
    </div>

    <button
      type="button"
      class="work-shelf-toolbox"
      :title="$t('workShelf.openToolbox')"
      @click="openToolbox"
    >
      <WrenchIcon aria-hidden="true" />
      <span>{{ $t('nav.workspace') }}</span>
    </button>
  </footer>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import WrenchIcon from './icons/WrenchIcon.vue'
import { toolsConfig } from '../config/tools'
import { sitesConfig } from '../config/sites'
import { getIcon } from '../utils/iconMapper'
import { localStorage as appStorage } from '../utils/storage'

const ACTIVITY_EVENT = 'gworkspace:activity'
const FOCUS_TOOLBOX_EVENT = 'gworkspace:focus-toolbox'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const recentActivity = ref([])
const lastToolId = ref('')

const toolItems = computed(() => toolsConfig
  .filter((tool) => !tool.disabled)
  .map((tool) => ({
    id: tool.id,
    kind: 'tool',
    name: t(tool.nameKey),
    icon: getIcon(tool.iconName)
  })))

const externalItems = computed(() => sitesConfig.flatMap((group) => group.links.map((link) => ({
  id: link.id,
  kind: 'external',
  name: link.title,
  url: link.url,
  icon: getIcon(group.iconName)
}))))

const itemMap = computed(() => new Map([
  ...toolItems.value.map((item) => [`tool-${item.id}`, item]),
  ...externalItems.value.map((item) => [`external-${item.id}`, item])
]))

const recentItems = computed(() => {
  const resolved = recentActivity.value
    .map((item) => itemMap.value.get(`${item.kind}-${item.id}`))
    .filter(Boolean)

  if (!resolved.length && lastToolId.value) {
    const lastTool = itemMap.value.get(`tool-${lastToolId.value}`)
    if (lastTool) resolved.push(lastTool)
  }

  return resolved.slice(0, 3)
})

const roomKey = computed(() => {
  if (route.name === 'workspace') return 'workspace'
  if (route.name === 'blog' || route.name === 'blog-detail') return 'blog'
  if (route.name === 'portfolio') return 'portfolio'
  return 'home'
})

const currentRoomLabel = computed(() => {
  if (roomKey.value === 'workspace' && route.query.tool) {
    const routeToolId = Array.isArray(route.query.tool) ? route.query.tool[0] : route.query.tool
    const activeTool = toolItems.value.find((tool) => tool.id === routeToolId)
    if (activeTool) return `${t('nav.workspace')} / ${activeTool.name}`
  }

  return t(`nav.${roomKey.value}`)
})

watch(() => route.fullPath, refreshActivity)

onMounted(() => {
  refreshActivity()
  window.addEventListener(ACTIVITY_EVENT, handleActivityUpdate)
  window.addEventListener('storage', refreshActivity)
})

onUnmounted(() => {
  window.removeEventListener(ACTIVITY_EVENT, handleActivityUpdate)
  window.removeEventListener('storage', refreshActivity)
})

function sanitizeActivity(value) {
  if (!Array.isArray(value)) return []
  return value.filter((item) => (
    item &&
    typeof item.id === 'string' &&
    (item.kind === 'tool' || item.kind === 'external')
  )).slice(0, 8)
}

function refreshActivity() {
  recentActivity.value = sanitizeActivity(appStorage.get('workspace-recent-entries', []))
  lastToolId.value = appStorage.get('workspace-last-tool', '') || ''
}

function handleActivityUpdate(event) {
  const detail = event.detail || {}
  recentActivity.value = sanitizeActivity(detail.recentEntries ?? appStorage.get('workspace-recent-entries', []))
  lastToolId.value = detail.lastToolId ?? appStorage.get('workspace-last-tool', '') ?? ''
}

function activateItem(item) {
  if (item.kind === 'tool') {
    router.push({ name: 'workspace', query: { tool: item.id } })
    return
  }

  window.open(item.url, '_blank', 'noopener,noreferrer')
}

async function openToolbox() {
  if (route.name === 'workspace') {
    window.dispatchEvent(new Event(FOCUS_TOOLBOX_EVENT))
    return
  }

  await router.push({ name: 'workspace', query: { focus: 'search' } })
}
</script>

<style scoped>
.work-shelf {
  display: grid;
  grid-template-columns: minmax(9.5rem, auto) minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.9rem;
  min-height: 4.15rem;
  padding: 0.55rem 14rem 0.55rem 1rem;
  border-top: 1px solid var(--border-strong);
  background: linear-gradient(90deg, color-mix(in srgb, var(--surface-overlay) 94%, transparent), color-mix(in srgb, var(--surface-elevated) 88%, transparent));
  box-shadow: 0 -12px 30px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(var(--blur-float)) saturate(1.06);
  -webkit-backdrop-filter: blur(var(--blur-float)) saturate(1.06);
}

.work-shelf-room,
.work-shelf-activity,
.work-shelf-items,
.work-shelf-item,
.work-shelf-toolbox {
  display: flex;
  align-items: center;
}

.work-shelf-room {
  gap: 0.65rem;
  min-width: 0;
}

.work-shelf-room-mark {
  width: 0.22rem;
  height: 2.1rem;
  flex: none;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--theme-primary-light), var(--theme-primary-dark));
  box-shadow: 0 0 14px color-mix(in srgb, var(--theme-primary) 24%, transparent);
}

.work-shelf-room-copy {
  display: grid;
  min-width: 0;
}

.work-shelf-room-copy strong {
  overflow: hidden;
  color: var(--text-main);
  font-size: 0.8rem;
  font-weight: 830;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-shelf-kicker {
  color: var(--text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.58rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  line-height: 1.25;
  text-transform: uppercase;
}

.work-shelf-activity {
  gap: 0.65rem;
  min-width: 0;
  padding-left: 0.9rem;
  border-left: 1px solid var(--border-strong);
}

.work-shelf-activity-label {
  flex: none;
}

.work-shelf-items {
  gap: 0.38rem;
  min-width: 0;
  overflow: hidden;
}

.work-shelf-item,
.work-shelf-toolbox {
  justify-content: center;
  gap: 0.42rem;
  height: 2.35rem;
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface-elevated) 90%, transparent);
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 780;
  transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.work-shelf-item {
  min-width: 0;
  max-width: 10.5rem;
  padding: 0 0.65rem;
}

.work-shelf-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-shelf-item-icon,
.work-shelf-toolbox svg {
  width: 0.95rem;
  height: 0.95rem;
  flex: none;
}

.work-shelf-item:hover,
.work-shelf-toolbox:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--theme-primary) 28%, var(--border-strong));
  background: color-mix(in srgb, var(--theme-primary) 8%, var(--surface-elevated));
  color: var(--text-main);
}

.work-shelf-item:focus-visible,
.work-shelf-toolbox:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--theme-primary) 44%, transparent);
  outline-offset: 2px;
}

.work-shelf-empty {
  overflow: hidden;
  color: var(--text-muted);
  font-size: 0.7rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-shelf-toolbox {
  padding: 0 0.72rem;
}

@media (max-width: 960px) {
  .work-shelf {
    grid-template-columns: minmax(8rem, auto) minmax(0, 1fr) auto;
  }

  .work-shelf-activity-label,
  .work-shelf-items .work-shelf-item:nth-child(n + 2) {
    display: none;
  }
}

@media (max-width: 767px) {
  .work-shelf {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.45rem;
    min-height: 3.65rem;
    padding: 0.45rem 4.35rem 0.45rem 0.7rem;
  }

  .work-shelf-room-mark {
    height: 1.8rem;
  }

  .work-shelf-kicker,
  .work-shelf-activity {
    display: none;
  }

  .work-shelf-room-copy strong {
    font-size: 0.74rem;
  }

  .work-shelf-toolbox {
    width: 2.35rem;
    padding: 0;
  }

  .work-shelf-toolbox span {
    display: none;
  }
}
</style>
