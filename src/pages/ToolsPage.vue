<template>
  <div class="toolbox-page animate-fade-in">
    <div class="toolbox-shell">
      <section class="toolbox-dashboard surface-panel shadow-lg">
        <div class="toolbox-commandbar">
          <div class="toolbox-dashboard-title-block">
            <span class="toolbox-dashboard-label">{{ groupNameMap[activeToolData.group] }}</span>
            <h1 class="toolbox-dashboard-title">{{ activeToolData?.name || $t('tools.title') }}</h1>
            <span v-if="activeToolData.badge" class="toolbox-dashboard-badge">{{ activeToolData.badge }}</span>
          </div>

          <div class="toolbox-dashboard-actions">
            <button
              class="toolbox-secondary-btn toolbox-trigger-btn"
              :class="{ 'is-active': showToolMenu }"
              @click="showToolMenu = !showToolMenu"
            >
              <span class="toolbox-trigger-copy">
                <strong>{{ $t('tools.workspace.openTool') }}</strong>
              </span>
              <svg class="toolbox-trigger-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="m5 7 5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <button
          v-if="showToolMenu"
          class="toolbox-menu-scrim"
          type="button"
          aria-label="Close toolbox menu"
          @click="showToolMenu = false"
        ></button>

        <div v-if="showToolMenu" class="toolbox-menu-popover">
          <section class="toolbox-menu-section">
            <div class="toolbox-menu-section-head">
              <span class="toolbox-filter-label">{{ $t('tools.workspace.recentTitle') }}</span>
              <span class="toolbox-menu-count">{{ recentTools.length }}</span>
            </div>
            <div v-if="recentTools.length" class="toolbox-menu-list">
              <button
                v-for="tool in recentTools"
                :key="tool.id"
                class="toolbox-menu-item"
                :class="{ 'is-active': activeToolId === tool.id }"
                @click="openToolFromMenu(tool.id)"
              >
                <component :is="tool.icon" class="w-4 h-4 shrink-0" />
                <span class="truncate">{{ tool.name }}</span>
              </button>
            </div>
            <p v-else class="toolbox-menu-empty">{{ $t('tools.workspace.recentEmpty') }}</p>
          </section>

          <section
            v-for="group in groups"
            :key="group.id"
            class="toolbox-menu-section"
          >
            <div class="toolbox-menu-section-head">
              <span class="toolbox-filter-label">{{ group.title }}</span>
              <span class="toolbox-menu-count">{{ group.tools.length }}</span>
            </div>
            <div class="toolbox-menu-list">
              <button
                v-for="tool in group.tools"
                :key="tool.id"
                class="toolbox-menu-item"
                :class="{ 'is-active': activeToolId === tool.id }"
                @click="openToolFromMenu(tool.id)"
              >
                <component :is="tool.icon" class="w-4 h-4 shrink-0" />
                <span class="truncate">{{ tool.name }}</span>
                <span v-if="tool.badge" class="toolbox-menu-badge">{{ tool.badge }}</span>
              </button>
            </div>
          </section>
        </div>
      </section>

      <section ref="workspaceRef" class="toolbox-workspace surface-panel rounded-[32px] shadow-lg overflow-hidden">
        <div :class="['toolbox-workspace-body', workspacePaddingClass, workspaceScrollClass]">
          <component :is="activeToolComponent" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import BlogAssistantTool from '../components/tools/BlogAssistantTool.vue'
import CalculatorTool from '../components/tools/CalculatorTool.vue'
import ColorPickerTool from '../components/tools/ColorPickerTool.vue'
import EncoderTool from '../components/tools/EncoderTool.vue'
import JsonTool from '../components/tools/JsonTool.vue'
import MarkdownTool from '../components/tools/MarkdownTool.vue'
import PomodoroTool from '../components/tools/PomodoroTool.vue'
import QRCodeTool from '../components/tools/QRCodeTool.vue'
import StopwatchTool from '../components/tools/StopwatchTool.vue'
import ThesisParserTool from '../components/tools/ThesisParserTool.vue'
import TodoTool from '../components/tools/TodoTool.vue'
import WorldClockTool from '../components/tools/WorldClockTool.vue'
import { useLocalStorage } from '../composables/useStorage'
import { toolGroups, toolsConfig } from '../config/tools'
import { getIcon } from '../utils/iconMapper'

const toolComponentMap = {
  'blog-assistant': BlogAssistantTool,
  calc: CalculatorTool,
  colorpicker: ColorPickerTool,
  encode: EncoderTool,
  json: JsonTool,
  markdown: MarkdownTool,
  pomodoro: PomodoroTool,
  qrcode: QRCodeTool,
  stopwatch: StopwatchTool,
  'thesis-parser': ThesisParserTool,
  todo: TodoTool,
  worldclock: WorldClockTool
}

const scrollableToolIds = new Set(['blog-assistant', 'markdown', 'todo', 'json', 'encode', 'thesis-parser'])
const validToolIds = new Set(toolsConfig.map(tool => tool.id))

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const workspaceRef = ref(null)
const activeToolId = ref(null)
const showToolMenu = ref(false)
const { value: recentToolIds } = useLocalStorage('toolbox-recent-tools', [])
const { value: lastActiveToolId } = useLocalStorage('toolbox-last-active-tool', '')

const tools = computed(() => toolsConfig.map(tool => ({
  ...tool,
  name: t(tool.nameKey),
  description: t(tool.descriptionKey),
  badge: tool.badgeKey ? t(tool.badgeKey) : '',
  icon: getIcon(tool.iconName)
})))

const toolMap = computed(() => Object.fromEntries(tools.value.map(tool => [tool.id, tool])))

const groups = computed(() => toolGroups.map(group => {
  const groupTools = tools.value.filter(tool => tool.group === group.id)
  return {
    ...group,
    title: t(group.titleKey),
    description: t(group.descriptionKey),
    tools: groupTools
  }
}))

const groupNameMap = computed(() => Object.fromEntries(
  groups.value.map(group => [group.id, group.title])
))

const recentTools = computed(() => sanitizeIds(recentToolIds.value).map(toolId => toolMap.value[toolId]).filter(Boolean))
const featuredTool = computed(() => (
  toolMap.value['thesis-parser'] || toolMap.value['blog-assistant'] || tools.value[0] || null
))

const activeToolData = computed(() => {
  const normalizedId = normalizeToolId(activeToolId.value)
  return normalizedId ? toolMap.value[normalizedId] : featuredTool.value
})

const activeToolComponent = computed(() => (
  activeToolData.value ? toolComponentMap[activeToolData.value.id] || null : null
))

const workspacePaddingClass = computed(() => (
  activeToolData.value?.workspacePadding === 'compact'
    ? 'toolbox-workspace-body-compact'
    : 'toolbox-workspace-body-default'
))

const workspaceScrollClass = computed(() => (
  scrollableToolIds.has(activeToolData.value?.id)
    ? 'toolbox-workspace-body-scroll'
    : 'toolbox-workspace-body-static'
))

watch(
  [() => route.query.tool, () => lastActiveToolId.value, featuredTool],
  ([toolQuery, lastToolId, featured]) => {
    const routeToolId = normalizeToolId(toolQuery)
    if (!routeToolId && toolQuery) {
      const nextQuery = { ...route.query }
      delete nextQuery.tool
      router.replace({ query: nextQuery })
      return
    }

    const fallbackToolId = routeToolId || normalizeToolId(lastToolId) || featured?.id || null
    if (fallbackToolId && fallbackToolId !== activeToolId.value) {
      activeToolId.value = fallbackToolId
    }
  },
  { immediate: true }
)

watch(activeToolId, (toolId) => {
  const normalizedId = normalizeToolId(toolId)
  const currentRouteTool = normalizeToolId(route.query.tool)
  if (!normalizedId) return

  lastActiveToolId.value = normalizedId
  recentToolIds.value = [
    normalizedId,
    ...sanitizeIds(recentToolIds.value).filter(id => id !== normalizedId)
  ].slice(0, 6)

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

function normalizeToolId(toolId) {
  const nextId = Array.isArray(toolId) ? toolId[0] : toolId
  return typeof nextId === 'string' && validToolIds.has(nextId) ? nextId : null
}

function sanitizeIds(value) {
  if (!Array.isArray(value)) return []
  return value.filter(toolId => typeof toolId === 'string' && validToolIds.has(toolId))
}

async function openToolFromMenu(toolId) {
  showToolMenu.value = false
  await openTool(toolId)
}

async function openTool(toolId) {
  const normalizedId = normalizeToolId(toolId)
  if (!normalizedId) return

  activeToolId.value = normalizedId
  await nextTick()

  if (typeof window !== 'undefined' && window.innerWidth < 1280) {
    workspaceRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<style scoped>
@import '../styles/pages/ToolsPage.css';
</style>
