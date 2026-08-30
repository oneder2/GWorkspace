import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useDailyCapsule } from './useDailyCapsule'
import { useWorkspaceJournal, getLocalDateKey } from './useWorkspaceJournal'
import { getTerminalAgentCopy, getTerminalAgentLocale, terminalAgentMeta } from '../config/terminalAgent'
import { toolsConfig } from '../config/tools'
import { i18n } from '../i18n'
import { aiApi } from '../utils/api'
import { localStorage as storage } from '../utils/storage'

const MAX_HISTORY_ENTRIES = 40
const MAX_COMMAND_HISTORY = 30

function formatTemplate(template, replacements = {}) {
  return Object.entries(replacements).reduce((message, [key, value]) => {
    return message.replaceAll(`{${key}}`, String(value))
  }, template)
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function sanitizeHistory(value) {
  if (!Array.isArray(value)) return []

  return value
    .filter((entry) => entry && typeof entry === 'object' && Array.isArray(entry.blocks))
    .slice(-MAX_HISTORY_ENTRIES)
}

function sanitizeCommands(value) {
  if (!Array.isArray(value)) return []
  return value.filter((item) => typeof item === 'string' && item.trim()).slice(-MAX_COMMAND_HISTORY)
}

function formatTime(value, locale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function isCompactViewport() {
  return typeof window !== 'undefined' && window.innerWidth < 768
}

function withTimeout(promise, milliseconds, message) {
  let timer = null
  const timeout = new Promise((resolve, reject) => {
    timer = window.setTimeout(() => reject(new Error(message)), milliseconds)
  })

  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer))
}

export function useTerminalAgent() {
  const route = useRoute()
  const locale = computed(() => getTerminalAgentLocale(i18n.global.locale.value))
  const copy = computed(() => getTerminalAgentCopy(locale.value))
  const prompt = computed(() => copy.value.meta.prompt)
  const { capsule: dailyCapsule, loadDailyCapsule } = useDailyCapsule()
  const { todayEntries, addNote, addAnalysis } = useWorkspaceJournal()

  const isOpen = ref(false)
  const history = ref(sanitizeHistory(storage.get(terminalAgentMeta.historyStorageKey, [])))
  const currentCommand = ref('')
  const commandHistory = ref(sanitizeCommands(storage.get(terminalAgentMeta.commandStorageKey, [])))
  const historyIndex = ref(-1)
  const agentState = ref('idle')
  const focusToken = ref(0)
  const hasBooted = ref(Boolean(storage.get(terminalAgentMeta.bootStorageKey, false)))
  let stateResetTimer = null

  const launcherState = computed(() => copy.value.states[agentState.value])
  const emptyState = computed(() => ({
    title: copy.value.session.emptyTitle,
    body: copy.value.session.emptyBody,
    hints: copy.value.session.hints
  }))

  function persistHistory() {
    history.value = sanitizeHistory(history.value)
    storage.set(terminalAgentMeta.historyStorageKey, history.value)
  }

  function persistCommands() {
    commandHistory.value = sanitizeCommands(commandHistory.value)
    storage.set(terminalAgentMeta.commandStorageKey, commandHistory.value)
  }

  function pushEntry(entry) {
    history.value.push({ id: createId(), ...entry })
    persistHistory()
  }

  function setState(nextState, { reset = false } = {}) {
    if (stateResetTimer) window.clearTimeout(stateResetTimer)
    agentState.value = nextState

    if (reset && nextState !== 'idle') {
      stateResetTimer = window.setTimeout(() => {
        agentState.value = 'idle'
        stateResetTimer = null
      }, 2200)
    }
  }

  function getSourceContext() {
    const titleKey = route.meta?.titleKey
    return {
      sourceRoute: route.fullPath,
      sourceLabel: titleKey ? i18n.global.t(titleKey) : route.path
    }
  }

  function runBootSequence() {
    if (hasBooted.value || history.value.length > 0) return

    pushEntry({
      kind: 'boot',
      blocks: [{ type: 'lines', tone: 'boot', items: copy.value.session.bootLines }]
    })
    hasBooted.value = true
    storage.set(terminalAgentMeta.bootStorageKey, true)
  }

  function openPanel(action) {
    isOpen.value = true
    runBootSequence()
    if (action) selectAction(action)
  }

  function closePanel() {
    isOpen.value = false
  }

  function togglePanel() {
    if (isOpen.value) closePanel()
    else openPanel()
  }

  function closeForCompactViewport() {
    if (isCompactViewport()) closePanel()
  }

  function setCurrentCommand(value) {
    currentCommand.value = value
  }

  function requestInputFocus() {
    focusToken.value += 1
  }

  function selectAction(action) {
    if (action === 'capture') {
      currentCommand.value = locale.value === 'en' ? 'note: ' : '记：'
      requestInputFocus()
      return
    }

    if (action === 'analyze') {
      currentCommand.value = locale.value === 'en' ? 'analyze: ' : '拆：'
      requestInputFocus()
      return
    }

    if (action === 'review') {
      currentCommand.value = locale.value === 'en' ? 'review' : '回顾今天'
      executeCommand()
    }
  }

  function navigateHistory(direction) {
    if (commandHistory.value.length === 0) return

    if (direction === 'up') {
      historyIndex.value = Math.min(historyIndex.value + 1, commandHistory.value.length - 1)
      currentCommand.value = commandHistory.value[commandHistory.value.length - 1 - historyIndex.value]
      return
    }

    historyIndex.value -= 1
    if (historyIndex.value < 0) {
      historyIndex.value = -1
      currentCommand.value = ''
      return
    }
    currentCommand.value = commandHistory.value[commandHistory.value.length - 1 - historyIndex.value]
  }

  function parseCommand(rawCommand) {
    const captureMatch = rawCommand.match(/^(?:记|note)\s*[：:]\s*(.*)$/i)
    if (captureMatch) return { type: 'capture', content: captureMatch[1].trim() }

    const analysisMatch = rawCommand.match(/^(?:拆|analyze)\s*[：:]\s*(.*)$/i)
    if (analysisMatch) return { type: 'analyze', content: analysisMatch[1].trim() }

    const normalized = rawCommand.toLowerCase()
    if (rawCommand === '回顾今天' || normalized === 'review') return { type: 'review' }
    if (normalized === 'help') return { type: 'help' }
    if (normalized === 'capsule') return { type: 'capsule' }
    if (normalized === 'clear') return { type: 'clear' }
    return { type: 'unknown', content: rawCommand }
  }

  function getTodayToolActivity() {
    const todayKey = getLocalDateKey()
    const recent = storage.get('workspace-recent-entries', [])
    if (!Array.isArray(recent)) return []

    return recent
      .filter((item) => item?.accessedAt && getLocalDateKey(item.accessedAt) === todayKey)
      .map((item) => {
        const tool = toolsConfig.find((candidate) => candidate.id === item.id)
        return {
          label: tool ? i18n.global.t(tool.nameKey) : item.id,
          meta: formatTime(item.accessedAt, locale.value)
        }
      })
  }

  function buildReviewEntry(rawCommand) {
    const records = todayEntries.value
    const tools = getTodayToolActivity()
    const blocks = [
      { type: 'section-title', content: copy.value.responses.reviewTitle },
      {
        type: 'text',
        content: formatTemplate(copy.value.responses.reviewSummary, {
          records: records.length,
          tools: tools.length
        })
      }
    ]

    if (records.length === 0 && tools.length === 0) {
      blocks.push({ type: 'text', tone: 'muted', content: copy.value.responses.reviewEmpty })
    }

    if (records.length > 0) {
      blocks.push({
        type: 'timeline',
        label: copy.value.responses.recordsLabel,
        items: records.slice(0, 8).map((entry) => ({
          label: entry.summary,
          meta: `${entry.type === 'analysis' ? copy.value.ui.actions.analyze : copy.value.ui.actions.capture} · ${formatTime(entry.createdAt, locale.value)}`,
          tone: entry.type
        }))
      })
    }

    if (tools.length > 0) {
      blocks.push({ type: 'timeline', label: copy.value.responses.toolsLabel, items: tools })
    }

    pushEntry({ command: rawCommand, blocks })
    setState('idle')
  }

  function buildHelpEntry(rawCommand) {
    pushEntry({
      command: rawCommand,
      blocks: [
        { type: 'text', content: copy.value.responses.helpIntro },
        {
          type: 'commands',
          items: ['capture', 'analyze', 'review', 'capsule', 'clear'].map((name) => ({
            name,
            description: copy.value.commands[name].description
          }))
        },
        { type: 'text', tone: 'muted', content: copy.value.ui.localOnly }
      ]
    })
    setState('idle')
  }

  async function buildCapsuleEntry(rawCommand) {
    setState('processing')
    try {
      await loadDailyCapsule()
      pushEntry({
        command: rawCommand,
        blocks: dailyCapsule.value
          ? [
              { type: 'section-title', content: copy.value.responses.capsuleTitle },
              { type: 'text', content: dailyCapsule.value.thesis },
              { type: 'text', tone: 'muted', content: `“${dailyCapsule.value.source_text}”` },
              { type: 'text', content: dailyCapsule.value.takeaway }
            ]
          : [{ type: 'text', tone: 'muted', content: copy.value.responses.capsuleEmpty }]
      })
      setState('idle')
    } catch (error) {
      pushFailure(rawCommand, error)
    }
  }

  function pushFailure(rawCommand, error) {
    pushEntry({
      command: rawCommand,
      blocks: [{
        type: 'text',
        tone: 'error',
        content: formatTemplate(copy.value.system.failure, { message: error?.message || 'Unknown error' })
      }]
    })
    setState('failed', { reset: true })
  }

  async function executeCommand() {
    const rawCommand = currentCommand.value.trim()
    if (!rawCommand || agentState.value === 'processing') return

    const parsed = parseCommand(rawCommand)
    currentCommand.value = ''
    historyIndex.value = -1

    if (parsed.type === 'clear') {
      history.value = []
      persistHistory()
      setState('idle')
      return
    }

    commandHistory.value.push(rawCommand)
    persistCommands()

    if (parsed.type === 'capture') {
      if (!parsed.content) {
        pushEntry({ command: rawCommand, blocks: [{ type: 'text', tone: 'error', content: copy.value.system.emptyCapture }] })
        setState('failed', { reset: true })
        return
      }

      const saved = addNote(parsed.content, getSourceContext())
      pushEntry({
        command: rawCommand,
        blocks: [
          { type: 'section-title', content: copy.value.responses.captureTitle },
          { type: 'text', content: saved.content },
          { type: 'text', tone: 'success', content: copy.value.system.saved }
        ]
      })
      setState('saved', { reset: true })
      return
    }

    if (parsed.type === 'analyze') {
      if (!parsed.content) {
        pushEntry({ command: rawCommand, blocks: [{ type: 'text', tone: 'error', content: copy.value.system.emptyAnalysis }] })
        setState('failed', { reset: true })
        return
      }

      setState('processing')
      try {
        const result = await withTimeout(
          aiApi.analyze({ text: parsed.content }),
          30000,
          copy.value.system.timeout
        )
        addAnalysis(parsed.content, result, getSourceContext())
        pushEntry({
          command: rawCommand,
          blocks: [
            { type: 'section-title', content: copy.value.responses.analysisTitle },
            {
              type: 'analysis',
              items: ['thesis', 'appeal', 'boundary', 'takeaway'].map((key) => ({
                key,
                label: copy.value.responses.analysisLabels[key],
                content: result?.[key] || ''
              })).filter((item) => item.content)
            },
            { type: 'text', tone: 'success', content: copy.value.system.saved }
          ]
        })
        setState('saved', { reset: true })
      } catch (error) {
        pushFailure(rawCommand, error)
      }
      return
    }

    if (parsed.type === 'review') {
      buildReviewEntry(rawCommand)
      return
    }

    if (parsed.type === 'help') {
      buildHelpEntry(rawCommand)
      return
    }

    if (parsed.type === 'capsule') {
      await buildCapsuleEntry(rawCommand)
      return
    }

    pushEntry({
      command: rawCommand,
      blocks: [
        { type: 'text', tone: 'error', content: formatTemplate(copy.value.system.unknownCommand, { command: rawCommand }) },
        { type: 'text', tone: 'muted', content: copy.value.system.unknownHint }
      ]
    })
    setState('failed', { reset: true })
  }

  function handleLinkActivate() {
    closeForCompactViewport()
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && isOpen.value) closePanel()
  }

  function handleOpenEvent(event) {
    openPanel(event.detail?.action)
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener(terminalAgentMeta.openEvent, handleOpenEvent)
  })

  onUnmounted(() => {
    if (stateResetTimer) window.clearTimeout(stateResetTimer)
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener(terminalAgentMeta.openEvent, handleOpenEvent)
  })

  return {
    copy,
    currentCommand,
    emptyState,
    executeCommand,
    focusToken,
    handleLinkActivate,
    history,
    isOpen,
    launcherState,
    navigateHistory,
    openPanel,
    prompt,
    selectAction,
    setCurrentCommand,
    togglePanel,
    closePanel
  }
}
