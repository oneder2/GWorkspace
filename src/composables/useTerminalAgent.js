import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { portfolioConfig } from '../config/portfolio'
import { toolsConfig } from '../config/tools'
import { getTerminalAgentCopy, getTerminalAgentLocale, terminalAgentMeta } from '../config/terminalAgent'
import { i18n } from '../i18n'
import { blogApi } from '../utils/api'
import { getBlogDateValue } from '../utils/blogDate'
import { localStorage as storage } from '../utils/storage'

function formatTemplate(template, replacements = {}) {
  return Object.entries(replacements).reduce((message, [key, value]) => {
    return message.replaceAll(`{${key}}`, value)
  }, template)
}

function formatDateLabel(value, locale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : ''
  }

  const formatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
  return formatter.format(date)
}

function isCompactViewport() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.innerWidth < 768
}

export function useTerminalAgent() {
  const router = useRouter()
  const route = useRoute()

  const locale = computed(() => getTerminalAgentLocale(i18n.global.locale.value))
  const copy = computed(() => getTerminalAgentCopy(locale.value))
  const prompt = computed(() => copy.value.meta.prompt)

  const isOpen = ref(false)
  const history = ref([])
  const currentCommand = ref('')
  const commandHistory = ref([])
  const historyIndex = ref(-1)
  const launcherStateIndex = ref(0)
  const hasBooted = ref(Boolean(storage.get(terminalAgentMeta.storageKey, false)))
  const blogSnapshot = ref({
    recentPosts: [],
    stats: null,
    loaded: false
  })

  let launcherTimer = null
  let blogSnapshotPromise = null

  const launcherState = computed(() => {
    if (isOpen.value) {
      return copy.value.launcher.activeState
    }

    const states = copy.value.launcher.states
    return states[launcherStateIndex.value % states.length]
  })

  const availableCommands = computed(() => {
    return copy.value.commandOrder.map((commandName) => ({
      name: commandName,
      description: copy.value.commands[commandName].description
    }))
  })

  const emptyState = computed(() => ({
    title: copy.value.session.emptyTitle,
    body: copy.value.session.emptyBody,
    hints: copy.value.session.hints
  }))

  const latestPosts = computed(() => {
    return blogSnapshot.value.recentPosts.slice(0, 3).map((post) => ({
      label: post.title,
      meta: formatDateLabel(getBlogDateValue(post), locale.value),
      to: `/blog/${post.id}`
    }))
  })

  const publicRouteTargets = computed(() => {
    return [
      { to: '/', label: i18n.global.t('routes.home') },
      { to: '/sites', label: i18n.global.t('routes.sites') },
      { to: '/tools', label: i18n.global.t('routes.tools') },
      { to: '/blog', label: i18n.global.t('routes.blog') },
      { to: '/portfolio', label: i18n.global.t('routes.portfolio') }
    ]
  })

  const currentRouteLabel = computed(() => {
    if (!route.meta?.titleKey) {
      return route.path
    }

    return i18n.global.t(route.meta.titleKey)
  })

  const themeLabel = computed(() => {
    if (typeof document === 'undefined') {
      return copy.value.values.themeLight
    }

    return document.documentElement.classList.contains('dark')
      ? copy.value.values.themeDark
      : copy.value.values.themeLight
  })

  function pushEntry(entry) {
    history.value.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...entry
    })
  }

  function closeForCompactViewport() {
    if (isCompactViewport()) {
      isOpen.value = false
    }
  }

  async function ensureBlogSnapshotLoaded({ force = false } = {}) {
    if (!force && blogSnapshot.value.loaded) {
      return blogSnapshot.value
    }

    if (!force && blogSnapshotPromise) {
      return blogSnapshotPromise
    }

    blogSnapshotPromise = Promise.allSettled([
      blogApi.getStats(),
      blogApi.getList({
        limit: 8,
        sortBy: 'published_at',
        sortOrder: 'desc'
      })
    ])
      .then(([statsResult, postsResult]) => {
        const stats = statsResult.status === 'fulfilled' ? statsResult.value : null
        const recentPosts = postsResult.status === 'fulfilled' && Array.isArray(postsResult.value)
          ? postsResult.value
          : []
        const hasSuccessfulResponse = statsResult.status === 'fulfilled' || postsResult.status === 'fulfilled'

        blogSnapshot.value = {
          recentPosts,
          stats,
          loaded: hasSuccessfulResponse
        }

        if (statsResult.status === 'rejected') {
          console.error('Failed to load terminal blog stats:', statsResult.reason)
        }

        if (postsResult.status === 'rejected') {
          console.error('Failed to load terminal recent posts:', postsResult.reason)
        }

        return blogSnapshot.value
      })
      .finally(() => {
        blogSnapshotPromise = null
      })

    return blogSnapshotPromise
  }

  function buildSignalEntry() {
    const featuredPost = blogSnapshot.value.recentPosts[0]
    const totalArticles = blogSnapshot.value.stats?.totalArticles
    const articleCountLabel = Number.isFinite(totalArticles) ? String(totalArticles) : '--'

    return {
      blocks: [
        {
          type: 'text',
          content: copy.value.commands.signal.intro
        },
        {
          type: 'status',
          items: [
            { label: copy.value.labels.articles, value: articleCountLabel },
            { label: copy.value.labels.projects, value: String(portfolioConfig.length) },
            { label: copy.value.labels.tools, value: String(toolsConfig.length) },
            { label: copy.value.labels.currentRoute, value: currentRouteLabel.value }
          ]
        },
        {
          type: 'links',
          items: featuredPost
            ? [
                {
                  label: featuredPost.title,
                  meta: `${copy.value.labels.latestSignal} · ${formatDateLabel(getBlogDateValue(featuredPost), locale.value)}`,
                  to: `/blog/${featuredPost.id}`
                },
                {
                  label: i18n.global.t('routes.portfolio'),
                  meta: `${copy.value.labels.projects} · ${portfolioConfig.length}`,
                  to: '/portfolio'
                }
              ]
            : [
                {
                  label: i18n.global.t('routes.blog'),
                  meta: copy.value.labels.latestSignal,
                  to: '/blog'
                }
              ]
        }
      ]
    }
  }

  function buildRecentEntry() {
    return {
      blocks: [
        {
          type: 'text',
          content: copy.value.commands.recent.intro
        },
        {
          type: 'links',
          items: latestPosts.value.length > 0
            ? latestPosts.value
            : [
                {
                  label: i18n.global.t('routes.blog'),
                  meta: copy.value.labels.articles,
                  to: '/blog'
                }
              ]
        }
      ]
    }
  }

  function buildStatusEntry() {
    return {
      blocks: [
        {
          type: 'text',
          content: copy.value.commands.status.intro
        },
        {
          type: 'status',
          items: [
            { label: copy.value.labels.mode, value: copy.value.values.modePublic },
            { label: copy.value.labels.theme, value: themeLabel.value },
            { label: copy.value.labels.locale, value: locale.value.toUpperCase() },
            { label: copy.value.labels.memory, value: hasBooted.value ? copy.value.values.memoryWarm : copy.value.values.memoryCold }
          ]
        }
      ]
    }
  }

  function buildDriftTarget() {
    const articleTargets = blogSnapshot.value.recentPosts.map((post) => ({
      label: post.title,
      meta: formatDateLabel(getBlogDateValue(post), locale.value),
      to: `/blog/${post.id}`
    }))

    const targets = [...publicRouteTargets.value, ...articleTargets]
      .filter((target) => {
        const resolved = router.resolve(target.to)
        return resolved.fullPath !== route.fullPath
      })

    if (targets.length === 0) {
      return null
    }

    const randomIndex = Math.floor(Math.random() * targets.length)
    return targets[randomIndex]
  }

  function buildCommandHandlers() {
    return {
      help: () => ({
        blocks: [
          {
            type: 'text',
            content: copy.value.commands.help.intro
          },
          {
            type: 'commands',
            items: availableCommands.value
          }
        ]
      }),
      whoami: () => ({
        blocks: copy.value.commands.whoami.blocks
      }),
      signal: buildSignalEntry,
      recent: buildRecentEntry,
      drift: () => {
        const target = buildDriftTarget()

        if (!target) {
          router.push('/')
          return {
            blocks: [
              {
                type: 'text',
                content: copy.value.system.driftFallback
              }
            ]
          }
        }

        router.push(target.to)
        closeForCompactViewport()

        return {
          blocks: [
            {
              type: 'text',
              content: formatTemplate(copy.value.commands.drift.response, {
                target: target.label
              })
            },
            {
              type: 'links',
              items: [target]
            }
          ]
        }
      },
      status: buildStatusEntry,
      ask: () => ({
        blocks: copy.value.commands.ask.blocks
      })
    }
  }

  function runBootSequence() {
    if (hasBooted.value) {
      return
    }

    pushEntry({
      kind: 'boot',
      blocks: [
        {
          type: 'lines',
          tone: 'boot',
          items: copy.value.session.bootLines
        }
      ]
    })

    hasBooted.value = true
    storage.set(terminalAgentMeta.storageKey, true)
  }

  function openPanel() {
    isOpen.value = true
    runBootSequence()
    ensureBlogSnapshotLoaded()
  }

  function closePanel() {
    isOpen.value = false
  }

  function togglePanel() {
    if (isOpen.value) {
      closePanel()
      return
    }

    openPanel()
  }

  function navigateHistory(direction) {
    if (commandHistory.value.length === 0) {
      return
    }

    if (direction === 'up') {
      const nextIndex = Math.min(historyIndex.value + 1, commandHistory.value.length - 1)
      historyIndex.value = nextIndex
      currentCommand.value = commandHistory.value[commandHistory.value.length - 1 - nextIndex]
      return
    }

    if (direction === 'down') {
      const nextIndex = historyIndex.value - 1
      if (nextIndex < 0) {
        historyIndex.value = -1
        currentCommand.value = ''
        return
      }

      historyIndex.value = nextIndex
      currentCommand.value = commandHistory.value[commandHistory.value.length - 1 - nextIndex]
    }
  }

  function setCurrentCommand(value) {
    currentCommand.value = value
  }

  function handleLinkActivate() {
    closeForCompactViewport()
  }

  async function executeCommand() {
    const rawCommand = currentCommand.value.trim()

    if (!rawCommand) {
      return
    }

    if (rawCommand.toLowerCase() === 'clear') {
      history.value = []
      currentCommand.value = ''
      historyIndex.value = -1
      return
    }

    commandHistory.value.push(rawCommand)
    historyIndex.value = -1

    const commandName = rawCommand.split(/\s+/)[0].toLowerCase()
    const commandHandlers = buildCommandHandlers()
    const handler = commandHandlers[commandName]

    if (!handler) {
      pushEntry({
        command: rawCommand,
        blocks: [
          {
            type: 'text',
            tone: 'error',
            content: formatTemplate(copy.value.system.unknownCommand, {
              command: commandName
            })
          },
          {
            type: 'text',
            tone: 'muted',
            content: copy.value.system.unknownHint
          }
        ]
      })
      currentCommand.value = ''
      return
    }

    if (['signal', 'recent', 'drift'].includes(commandName)) {
      await ensureBlogSnapshotLoaded()
    }

    const result = await handler()
    pushEntry({
      command: rawCommand,
      blocks: result.blocks
    })
    currentCommand.value = ''
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && isOpen.value) {
      closePanel()
    }
  }

  onMounted(() => {
    launcherTimer = window.setInterval(() => {
      launcherStateIndex.value = launcherStateIndex.value + 1
    }, 2800)

    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    if (launcherTimer) {
      window.clearInterval(launcherTimer)
    }

    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    copy,
    currentCommand,
    emptyState,
    executeCommand,
    handleLinkActivate,
    history,
    isOpen,
    launcherState,
    navigateHistory,
    openPanel,
    prompt,
    setCurrentCommand,
    togglePanel,
    closePanel
  }
}
