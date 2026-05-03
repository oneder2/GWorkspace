<template>
  <div class="space-y-6">
    <div class="admin-panel rounded-[24px] overflow-hidden">
      <div class="admin-toolbar flex-col lg:flex-row lg:items-end">
        <div class="space-y-2">
          <span class="section-kicker">{{ $t('admin.aiOps') }}</span>
          <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.ai') }}</h2>
          <p class="text-sm text-secondary">{{ $t('admin.aiCopy') }}</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            @click="loadAll"
            class="action-btn action-btn-secondary text-sm"
            :disabled="isLoadingSeeds || isLoadingCapsule"
          >
            {{ $t('admin.refresh') }}
          </button>
          <button
            @click="refreshCapsule()"
            class="action-btn action-btn-primary text-sm"
            :disabled="isRefreshingCapsule"
          >
            {{ isRefreshingCapsule ? $t('common.loading') : $t('admin.refreshDailyCapsule') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="statusMessage" class="admin-panel p-4 rounded-[20px] text-sm" :class="statusToneClass">
      {{ statusMessage }}
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div v-for="card in summaryCards" :key="card.label" class="admin-stat p-6 rounded-[24px] space-y-3">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ $t(card.label) }}</p>
          <span class="status-pill" :class="card.badgeClass">{{ card.badge }}</span>
        </div>
        <p class="text-3xl font-bold text-slate-800 dark:text-slate-200">{{ card.value }}</p>
        <p class="text-xs text-slate-500 dark:text-slate-400 leading-5">{{ card.detail }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <section class="admin-panel p-6 rounded-[24px] space-y-5">
        <div>
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.addAiSeed') }}</h3>
          <p class="text-sm text-secondary">{{ $t('admin.addAiSeedCopy') }}</p>
        </div>

        <div class="grid gap-4">
          <label class="space-y-2">
            <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ $t('admin.seedSourceLabel') }}</span>
            <input v-model="manualForm.source_label" type="text" class="admin-input" :placeholder="$t('admin.seedSourceLabelPlaceholder')">
          </label>

          <label class="space-y-2">
            <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ $t('admin.seedSourceUrl') }}</span>
            <input v-model="manualForm.source_url" type="text" class="admin-input" :placeholder="$t('admin.seedSourceUrlPlaceholder')">
          </label>

          <label class="space-y-2">
            <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ $t('admin.seedText') }}</span>
            <textarea v-model="manualForm.source_text" rows="4" class="admin-textarea" :placeholder="$t('admin.seedTextPlaceholder')"></textarea>
          </label>
        </div>

        <div class="flex justify-end">
          <button
            @click="submitManualSeed"
            class="action-btn action-btn-primary text-sm"
            :disabled="isSubmittingSeed"
          >
            {{ isSubmittingSeed ? $t('common.loading') : $t('admin.addAiSeed') }}
          </button>
        </div>
      </section>

      <section class="admin-panel p-6 rounded-[24px] space-y-5">
        <div>
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.importAiSeeds') }}</h3>
          <p class="text-sm text-secondary">{{ $t('admin.importAiSeedsCopy') }}</p>
        </div>

        <div class="grid gap-4">
          <label class="space-y-2">
            <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ $t('admin.seedSourceLabel') }}</span>
            <input v-model="importForm.source_label" type="text" class="admin-input" :placeholder="$t('admin.importSourceLabelPlaceholder')">
          </label>

          <label class="space-y-2">
            <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ $t('admin.seedSourceUrl') }}</span>
            <input v-model="importForm.source_url" type="text" class="admin-input" :placeholder="$t('admin.seedSourceUrlPlaceholder')">
          </label>

          <label class="space-y-2">
            <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ $t('admin.batchSeedText') }}</span>
            <textarea v-model="importForm.raw_text" rows="8" class="admin-textarea" :placeholder="$t('admin.batchSeedTextPlaceholder')"></textarea>
          </label>
        </div>

        <div class="space-y-2">
          <p class="text-xs uppercase tracking-[0.22em] text-slate-400">{{ $t('admin.whitelistDomains') }}</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="domain in whitelistDomains"
              :key="domain"
              class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              {{ domain }}
            </span>
          </div>
        </div>

        <div class="flex justify-end">
          <button
            @click="submitImportSeeds"
            class="action-btn action-btn-primary text-sm"
            :disabled="isImportingSeeds"
          >
            {{ isImportingSeeds ? $t('common.loading') : $t('admin.importAiSeeds') }}
          </button>
        </div>
      </section>
    </div>

    <section class="admin-panel p-6 rounded-[24px] space-y-5">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.dailyCapsule') }}</h3>
          <p class="text-sm text-secondary">{{ $t('admin.dailyCapsuleCopy') }}</p>
        </div>
        <div class="text-xs font-mono text-slate-500 dark:text-slate-400">
          {{ capsuleDateLabel }}
        </div>
      </div>

      <div v-if="dailyCapsule" class="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
        <div class="p-5 rounded-[22px] border border-border-base bg-white/50 dark:bg-slate-900/40 space-y-4">
          <div class="space-y-2">
            <div class="text-xs uppercase tracking-[0.22em] text-slate-400">{{ $t('admin.dailyCapsuleSource') }}</div>
            <p class="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-8">“{{ dailyCapsule.source_text }}”</p>
          </div>
          <div class="flex flex-wrap gap-2 text-xs">
            <span class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {{ dailyCapsule.source_label || 'manual' }}
            </span>
            <span class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {{ runtimeMode }}
            </span>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400 leading-6">{{ dailyCapsule.greeting }}</p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <article class="admin-subcard">
            <div class="admin-subcard-head">{{ $t('admin.dailyCapsuleThesis') }}</div>
            <div class="admin-subcard-copy">{{ dailyCapsule.thesis }}</div>
          </article>
          <article class="admin-subcard">
            <div class="admin-subcard-head">{{ $t('admin.dailyCapsuleBoundary') }}</div>
            <div class="admin-subcard-copy">{{ dailyCapsule.boundary }}</div>
          </article>
          <article class="admin-subcard md:col-span-2">
            <div class="admin-subcard-head">{{ $t('admin.dailyCapsuleTakeaway') }}</div>
            <div class="admin-subcard-copy">{{ dailyCapsule.takeaway }}</div>
          </article>
        </div>
      </div>

      <div v-else class="text-sm text-slate-500 dark:text-slate-400">
        {{ $t('admin.noDailyCapsule') }}
      </div>
    </section>

    <section class="admin-panel rounded-[24px] overflow-hidden">
      <div class="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.aiSeedPool') }}</h3>
          <p class="text-sm text-secondary">{{ $t('admin.aiSeedPoolCopy') }}</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex gap-2">
            <button
              v-for="status in seedStatusOptions"
              :key="status.value"
              @click="changeStatus(status.value)"
              class="px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
              :class="seedStatus === status.value
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'"
            >
              {{ status.label }}
            </button>
          </div>
          <div class="flex gap-2">
            <input
              v-model="search"
              type="text"
              class="admin-input min-w-[220px]"
              :placeholder="$t('admin.seedSearchPlaceholder')"
              @keyup.enter="loadSeeds"
            >
            <button @click="loadSeeds" class="action-btn action-btn-secondary text-sm">
              {{ $t('admin.refresh') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="isLoadingSeeds" class="p-8 text-center text-slate-500 dark:text-slate-400">
        {{ $t('common.loading') }}
      </div>
      <div v-else-if="seeds.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400">
        {{ $t('admin.noAiSeeds') }}
      </div>
      <div v-else class="divide-y divide-slate-200 dark:divide-slate-700">
        <div
          v-for="seed in seeds"
          :key="seed.id"
          class="p-5 sm:p-6 hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
        >
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div class="flex-1 min-w-0 space-y-3">
              <div class="flex flex-wrap items-center gap-2.5">
                <span class="font-semibold text-slate-800 dark:text-slate-200">{{ seed.source_label || 'manual' }}</span>
                <span class="status-pill" :class="seed.status === 'active' ? 'status-pill-success' : 'status-pill-neutral'">
                  {{ seed.status === 'active' ? $t('admin.active') : $t('admin.archived') }}
                </span>
                <span v-if="seed.source_domain" class="text-xs text-slate-500 dark:text-slate-400">{{ seed.source_domain }}</span>
                <span class="text-xs text-slate-500 dark:text-slate-400">
                  {{ seed.used_at ? formatDateTime(seed.used_at) : $t('admin.notUsedYet') }}
                </span>
              </div>

              <p class="text-sm text-slate-700 dark:text-slate-300 leading-7">
                {{ seed.source_text }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 xl:pl-4">
              <button
                v-if="seed.status === 'active'"
                @click="refreshCapsule(seed.id)"
                class="action-btn action-btn-secondary text-sm"
                :disabled="isRefreshingCapsule"
              >
                {{ $t('admin.useForDailyCapsule') }}
              </button>
              <button
                @click="toggleSeedStatus(seed)"
                class="action-btn text-sm"
                :class="seed.status === 'active'
                  ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                  : 'action-btn-secondary'"
              >
                {{ seed.status === 'active' ? $t('admin.archive') : $t('admin.restore') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminApi } from '../../utils/api'

const { t } = useI18n()

const seeds = ref([])
const summary = ref({ total: 0, active: 0, archived: 0, unused_active: 0 })
const whitelistDomains = ref([])
const dailyCapsule = ref(null)
const runtime = ref(null)
const seedStatus = ref('active')
const search = ref('')
const isLoadingSeeds = ref(false)
const isLoadingCapsule = ref(false)
const isSubmittingSeed = ref(false)
const isImportingSeeds = ref(false)
const isRefreshingCapsule = ref(false)
const statusMessage = ref('')
const statusTone = ref('neutral')

const manualForm = ref({
  source_label: 'manual',
  source_url: '',
  source_text: ''
})

const importForm = ref({
  source_label: 'monthly batch',
  source_url: '',
  raw_text: ''
})

const seedStatusOptions = computed(() => [
  { value: 'active', label: t('admin.active') },
  { value: 'archived', label: t('admin.archived') },
  { value: 'all', label: t('admin.allStatuses') }
])

const runtimeMode = computed(() => runtime.value?.provider_mode || 'local-fallback')

const capsuleDateLabel = computed(() => {
  const dateValue = dailyCapsule.value?.capsule_date
  return dateValue ? formatDateTime(dateValue) : t('admin.noDailyCapsule')
})

const summaryCards = computed(() => [
  {
    label: 'admin.activeAiSeeds',
    value: summary.value.active || 0,
    detail: t('admin.activeAiSeedsCopy'),
    badge: t('admin.active'),
    badgeClass: 'status-pill-success'
  },
  {
    label: 'admin.unusedAiSeeds',
    value: summary.value.unused_active || 0,
    detail: t('admin.unusedAiSeedsCopy'),
    badge: t('admin.review'),
    badgeClass: 'status-pill-warm'
  },
  {
    label: 'admin.dailyCapsule',
    value: dailyCapsule.value ? dailyCapsule.value.capsule_date : '—',
    detail: t('admin.dailyCapsuleStatusCopy'),
    badge: runtimeMode.value,
    badgeClass: 'status-pill-neutral'
  },
  {
    label: 'admin.aiRuntime',
    value: runtime.value?.remote_enabled ? t('admin.remoteReady') : t('admin.localFallback'),
    detail: runtime.value?.model || '—',
    badge: runtime.value?.remote_enabled ? t('admin.connected') : t('admin.notConfigured'),
    badgeClass: runtime.value?.remote_enabled ? 'status-pill-success' : 'status-pill-neutral'
  }
])

const statusToneClass = computed(() => {
  if (statusTone.value === 'success') {
    return 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
  }

  if (statusTone.value === 'danger') {
    return 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20'
  }

  return 'text-slate-700 dark:text-slate-200 bg-slate-500/10 border border-slate-500/20'
})

const setStatusMessage = (message, tone = 'neutral') => {
  statusMessage.value = message
  statusTone.value = tone
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

async function loadSeeds() {
  isLoadingSeeds.value = true

  try {
    const response = await adminApi.getAiSeeds({
      status: seedStatus.value,
      search: search.value.trim()
    })
    seeds.value = response.seeds || []
    summary.value = response.summary || summary.value
    whitelistDomains.value = response.whitelist_domains || []
  } catch (error) {
    setStatusMessage(error.message || t('admin.loadAiFailed'), 'danger')
  } finally {
    isLoadingSeeds.value = false
  }
}

async function loadCapsule() {
  isLoadingCapsule.value = true

  try {
    const response = await adminApi.getAiDailyCapsule()
    dailyCapsule.value = response.capsule || null
    runtime.value = response.runtime || null
  } catch (error) {
    setStatusMessage(error.message || t('admin.loadAiFailed'), 'danger')
  } finally {
    isLoadingCapsule.value = false
  }
}

async function loadAll() {
  await Promise.all([loadSeeds(), loadCapsule()])
}

async function submitManualSeed() {
  if (!manualForm.value.source_text.trim()) {
    return
  }

  isSubmittingSeed.value = true

  try {
    const response = await adminApi.createAiSeed(manualForm.value)
    summary.value = response.summary || summary.value
    manualForm.value.source_text = ''
    setStatusMessage(t('admin.seedCreateSuccess'), 'success')
    await loadSeeds()
  } catch (error) {
    setStatusMessage(error.message || t('admin.seedCreateFailed'), 'danger')
  } finally {
    isSubmittingSeed.value = false
  }
}

async function submitImportSeeds() {
  if (!importForm.value.raw_text.trim()) {
    return
  }

  isImportingSeeds.value = true

  try {
    const response = await adminApi.importAiSeeds(importForm.value)
    summary.value = response.summary || summary.value
    whitelistDomains.value = response.whitelist_domains || whitelistDomains.value
    importForm.value.raw_text = ''
    setStatusMessage(t('admin.seedImportSuccess', { count: response.created?.length || 0 }), 'success')
    await loadSeeds()
  } catch (error) {
    setStatusMessage(error.message || t('admin.seedImportFailed'), 'danger')
  } finally {
    isImportingSeeds.value = false
  }
}

async function refreshCapsule(seedId = null) {
  isRefreshingCapsule.value = true

  try {
    const response = await adminApi.refreshAiDailyCapsule(seedId ? { seed_id: seedId } : {})
    dailyCapsule.value = response.capsule || null
    runtime.value = response.runtime || null
    setStatusMessage(t('admin.dailyCapsuleRefreshSuccess'), 'success')
    await loadSeeds()
  } catch (error) {
    setStatusMessage(error.message || t('admin.dailyCapsuleRefreshFailed'), 'danger')
  } finally {
    isRefreshingCapsule.value = false
  }
}

async function toggleSeedStatus(seed) {
  try {
    const nextStatus = seed.status === 'active' ? 'archived' : 'active'
    const response = await adminApi.updateAiSeed(seed.id, { status: nextStatus })
    summary.value = response.summary || summary.value
    setStatusMessage(
      nextStatus === 'active' ? t('admin.seedRestoreSuccess') : t('admin.seedArchiveSuccess'),
      'success'
    )
    await loadSeeds()
  } catch (error) {
    setStatusMessage(error.message || t('admin.seedStatusFailed'), 'danger')
  }
}

async function changeStatus(status) {
  seedStatus.value = status
  await loadSeeds()
}

onMounted(() => {
  loadAll()
})
</script>

<style scoped>
.admin-input,
.admin-textarea,
.admin-subcard {
  border-radius: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.62);
}

.admin-input,
.admin-textarea {
  width: 100%;
  padding: 0.85rem 1rem;
  color: var(--color-text-main, #0f172a);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.admin-input:focus,
.admin-textarea:focus {
  border-color: color-mix(in srgb, var(--theme-primary) 55%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-primary) 14%, transparent);
}

.admin-textarea {
  min-height: 8rem;
  resize: vertical;
  line-height: 1.7;
}

.admin-subcard {
  padding: 1rem;
}

.admin-subcard-head {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-muted, #64748b);
}

.admin-subcard-copy {
  margin-top: 0.75rem;
  color: var(--color-text-main, #0f172a);
  line-height: 1.75;
  white-space: pre-wrap;
}

.dark .admin-input,
.dark .admin-textarea,
.dark .admin-subcard {
  background: rgba(15, 23, 42, 0.42);
  border-color: rgba(255, 255, 255, 0.08);
  color: rgba(248, 250, 252, 0.92);
}

.dark .admin-subcard-copy {
  color: rgba(248, 250, 252, 0.92);
}

.dark .admin-subcard-head {
  color: rgba(148, 163, 184, 0.85);
}
</style>
