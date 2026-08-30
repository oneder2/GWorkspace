import { computed, ref } from 'vue'
import { localStorage as storage } from '../utils/storage'

const STORAGE_KEY = 'workspace-journal'
const JOURNAL_EVENT = 'gworkspace:journal'
const MAX_ENTRIES = 120

const entries = ref([])
let initialized = false

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeText(value, maxLength = 4000) {
  return String(value || '').trim().slice(0, maxLength)
}

function sanitizeAnalysis(value) {
  if (!value || typeof value !== 'object') return null

  return {
    thesis: normalizeText(value.thesis, 1200),
    appeal: normalizeText(value.appeal, 1200),
    boundary: normalizeText(value.boundary, 1600),
    takeaway: normalizeText(value.takeaway, 1200),
    providerMode: normalizeText(value.provider_mode || value.providerMode, 120)
  }
}

function sanitizeEntry(value) {
  if (!value || typeof value !== 'object') return null
  if (value.type !== 'note' && value.type !== 'analysis') return null

  const content = normalizeText(value.content)
  const createdAt = new Date(value.createdAt)
  if (!content || Number.isNaN(createdAt.getTime())) return null

  return {
    id: typeof value.id === 'string' ? value.id : createId(),
    type: value.type,
    status: 'saved',
    content,
    summary: normalizeText(value.summary || content, 500),
    analysis: value.type === 'analysis' ? sanitizeAnalysis(value.analysis) : null,
    sourceRoute: normalizeText(value.sourceRoute || '/', 500),
    sourceLabel: normalizeText(value.sourceLabel, 120),
    createdAt: createdAt.toISOString()
  }
}

function sanitizeEntries(value) {
  if (!Array.isArray(value)) return []

  return value
    .map(sanitizeEntry)
    .filter(Boolean)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, MAX_ENTRIES)
}

function getLocalDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function ensureInitialized() {
  if (initialized) return
  entries.value = sanitizeEntries(storage.get(STORAGE_KEY, []))
  initialized = true
}

function persistEntries() {
  entries.value = sanitizeEntries(entries.value)
  storage.set(STORAGE_KEY, entries.value)

  window.dispatchEvent(new CustomEvent(JOURNAL_EVENT, {
    detail: { entries: entries.value }
  }))
}

function addEntry(entry) {
  ensureInitialized()
  const normalized = sanitizeEntry({
    id: createId(),
    status: 'saved',
    createdAt: new Date().toISOString(),
    ...entry
  })

  if (!normalized) return null
  entries.value = [normalized, ...entries.value]
  persistEntries()
  return normalized
}

export function useWorkspaceJournal() {
  ensureInitialized()

  const todayEntries = computed(() => {
    const todayKey = getLocalDateKey()
    return entries.value.filter((entry) => getLocalDateKey(entry.createdAt) === todayKey)
  })

  function addNote(content, context = {}) {
    return addEntry({
      type: 'note',
      content,
      summary: content,
      sourceRoute: context.sourceRoute,
      sourceLabel: context.sourceLabel
    })
  }

  function addAnalysis(content, analysis, context = {}) {
    return addEntry({
      type: 'analysis',
      content,
      summary: analysis?.thesis || content,
      analysis,
      sourceRoute: context.sourceRoute,
      sourceLabel: context.sourceLabel
    })
  }

  function removeEntry(id) {
    const nextEntries = entries.value.filter((entry) => entry.id !== id)
    if (nextEntries.length === entries.value.length) return
    entries.value = nextEntries
    persistEntries()
  }

  return {
    entries,
    todayEntries,
    addNote,
    addAnalysis,
    removeEntry
  }
}

export { JOURNAL_EVENT, getLocalDateKey }
