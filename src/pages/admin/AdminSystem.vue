<!--
  管理后台系统页面
  提供数据库备份、系统健康和图片资源管理能力
-->
<template>
  <div class="space-y-6">
    <div class="admin-panel rounded-[24px] overflow-hidden">
      <div class="admin-toolbar flex-col lg:flex-row lg:items-end">
        <div class="space-y-2">
          <span class="section-kicker">{{ $t('admin.systemOperations') }}</span>
          <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.system') }}</h2>
          <p class="text-sm text-secondary">{{ $t('admin.systemCopy') }}</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            @click="loadAll"
            class="action-btn action-btn-secondary text-sm"
            :disabled="isLoadingHealth || isLoadingAssets"
          >
            {{ $t('admin.refresh') }}
          </button>
          <button
            @click="createBackup"
            class="action-btn action-btn-primary text-sm"
            :disabled="isCreatingBackup"
          >
            {{ isCreatingBackup ? $t('admin.backupInProgress') : $t('admin.createBackup') }}
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div
        v-for="card in summaryCards"
        :key="card.label"
        class="admin-stat p-6 rounded-[24px] space-y-3"
      >
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ $t(card.label) }}</p>
          <span class="status-pill" :class="statusClass(card.tone)">{{ card.badge }}</span>
        </div>
        <p class="text-3xl font-bold text-slate-800 dark:text-slate-200">{{ card.value }}</p>
        <p class="text-xs text-slate-500 dark:text-slate-400 leading-5">{{ card.detail }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div class="admin-panel p-6 rounded-[24px] space-y-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.databaseBackups') }}</h3>
            <p class="text-sm text-secondary">{{ $t('admin.backupLocation') }}</p>
          </div>
          <span class="status-pill status-pill-neutral">{{ health.backups.count || 0 }}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <p class="text-xs uppercase tracking-widest text-slate-400 mb-2">{{ $t('admin.databasePath') }}</p>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 break-all">{{ health.database.path || '—' }}</p>
          </div>
          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <p class="text-xs uppercase tracking-widest text-slate-400 mb-2">{{ $t('admin.backupDirectory') }}</p>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 break-all">{{ health.backups.directory || '—' }}</p>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-500 dark:text-slate-400">{{ $t('admin.latestBackup') }}</span>
            <span class="font-semibold text-slate-800 dark:text-slate-200">
              {{ health.backups.latest ? formatDateTime(health.backups.latest.updated_at) : $t('admin.noBackupYet') }}
            </span>
          </div>
          <div class="space-y-2">
            <div
              v-for="backup in health.backups.recent || []"
              :key="backup.path"
              class="flex items-center justify-between gap-4 p-3 rounded-2xl bg-white/50 dark:bg-slate-900/40 border border-border-base"
            >
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{{ backup.filename }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ formatDateTime(backup.updated_at) }}</p>
              </div>
              <span class="text-xs font-mono text-slate-500 dark:text-slate-400">{{ formatBytes(backup.size_bytes) }}</span>
            </div>
            <div v-if="!(health.backups.recent || []).length" class="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
              {{ $t('admin.noBackupYet') }}
            </div>
          </div>
        </div>
      </div>

      <div class="admin-panel p-6 rounded-[24px] space-y-5">
        <div>
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.storageStrategy') }}</h3>
          <p class="text-sm text-secondary">{{ $t('admin.objectStorage') }}</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <p class="text-xs uppercase tracking-widest text-slate-400 mb-2">{{ $t('admin.immutableCache') }}</p>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 break-words">
              {{ health.object_storage.cache_control || '—' }}
            </p>
          </div>
          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <p class="text-xs uppercase tracking-widest text-slate-400 mb-2">{{ $t('admin.cloudflarePurge') }}</p>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {{ health.object_storage.purge_configured ? $t('admin.purgeConfigured') : $t('admin.purgeUnavailable') }}
            </p>
          </div>
        </div>

        <div class="p-4 rounded-2xl border border-border-base bg-white/50 dark:bg-slate-900/40 space-y-2">
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ $t('admin.deletionPolicy') }}</p>
            <span class="status-pill status-pill-warm">{{ $t('admin.deleteUnused') }}</span>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400 leading-6">
            {{ $t('admin.deletionPolicyCopy') }}
          </p>
          <p v-if="!health.object_storage.configured" class="text-sm text-rose-500 dark:text-rose-400">
            {{ $t('admin.r2NotConfigured') }}
          </p>
          <p
            v-else-if="health.object_storage.public_domain"
            class="text-xs text-slate-500 dark:text-slate-400 break-all"
          >
            {{ health.object_storage.public_domain }}
          </p>
          <p
            v-else-if="health.object_storage.missing_fields?.length"
            class="text-xs text-slate-500 dark:text-slate-400 break-all"
          >
            {{ health.object_storage.missing_fields.join(', ') }}
          </p>
        </div>
      </div>
    </div>

    <div class="admin-panel rounded-[24px] overflow-hidden">
      <div class="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="space-y-1">
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.imageAssets') }}</h3>
          <p class="text-sm text-secondary">
            {{ assets.summary.total || 0 }} / {{ $t('admin.orphanImages') }} {{ assets.summary.orphaned || 0 }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            @click="showOrphansOnly = !showOrphansOnly"
            class="px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
            :class="showOrphansOnly
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'"
          >
            {{ $t('admin.showOrphansOnly') }}
          </button>
          <button
            @click="loadAssets"
            class="action-btn action-btn-secondary text-sm"
            :disabled="isLoadingAssets"
          >
            {{ $t('admin.refresh') }}
          </button>
        </div>
      </div>

      <div v-if="isLoadingAssets" class="p-8 text-center text-slate-500 dark:text-slate-400">
        {{ $t('common.loading') }}
      </div>
      <div v-else-if="!assets.configured" class="p-8 text-center text-slate-500 dark:text-slate-400 space-y-2">
        <p>{{ $t('admin.r2NotConfigured') }}</p>
        <p class="text-xs">{{ assets.missing_fields?.join(', ') || 'R2_PUBLIC_DOMAIN' }}</p>
      </div>
      <div v-else-if="filteredAssets.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400">
        {{ $t('admin.noAssets') }}
      </div>
      <div v-else class="divide-y divide-slate-200 dark:divide-slate-700">
        <div
          v-for="asset in filteredAssets"
          :key="asset.key"
          class="p-5 sm:p-6 hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
        >
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div class="flex-1 min-w-0 space-y-3">
              <div class="flex flex-wrap items-center gap-2.5">
                <span class="font-semibold text-slate-800 dark:text-slate-200 break-all">{{ asset.key }}</span>
                <span class="status-pill" :class="asset.referenced ? 'status-pill-neutral' : 'status-pill-success'">
                  {{ asset.referenced ? $t('admin.referencedImages') : $t('admin.orphanImages') }}
                </span>
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ formatBytes(asset.size_bytes) }}</span>
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ formatDateTime(asset.last_modified) }}</span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <p class="text-xs uppercase tracking-widest text-slate-400 mb-1">{{ $t('admin.assetKey') }}</p>
                  <p class="text-slate-700 dark:text-slate-300 break-all">{{ asset.key }}</p>
                </div>
                <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <p class="text-xs uppercase tracking-widest text-slate-400 mb-1">{{ $t('admin.referenceCount') }}</p>
                  <p class="text-slate-700 dark:text-slate-300">{{ asset.reference_count }}</p>
                </div>
                <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <p class="text-xs uppercase tracking-widest text-slate-400 mb-1">{{ $t('admin.lastModified') }}</p>
                  <p class="text-slate-700 dark:text-slate-300">{{ formatDateTime(asset.last_modified) }}</p>
                </div>
              </div>

              <div v-if="asset.referenced_by?.length" class="space-y-2">
                <p class="text-xs uppercase tracking-widest text-slate-400">{{ $t('admin.referencedBy') }}</p>
                <div class="flex flex-wrap gap-2">
                  <router-link
                    v-for="blog in asset.referenced_by"
                    :key="`${asset.key}-${blog.id}`"
                    :to="`/admin/blogs/${blog.id}`"
                    class="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {{ blog.title }}
                  </router-link>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 xl:pl-4">
              <button
                @click="deleteAsset(asset)"
                class="action-btn px-4 py-2 text-sm text-white"
                :class="asset.can_delete ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'"
                :disabled="!asset.can_delete || deletingKey === asset.key"
              >
                {{ deletingKey === asset.key ? $t('admin.loading') : $t('admin.deleteUnused') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminApi } from '../../utils/api'

const { t } = useI18n()

const isLoadingHealth = ref(false)
const isLoadingAssets = ref(false)
const isCreatingBackup = ref(false)
const deletingKey = ref('')
const showOrphansOnly = ref(true)

const health = ref({
  database: {},
  backups: {
    count: 0,
    recent: []
  },
  object_storage: {}
})

const assets = ref({
  configured: false,
  missing_fields: [],
  summary: {
    total: 0,
    referenced: 0,
    orphaned: 0
  },
  assets: []
})

const formatBytes = (value) => {
  const size = Number(value || 0)
  if (size <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
  const result = size / (1024 ** exponent)

  return `${result >= 100 ? Math.round(result) : result.toFixed(result >= 10 ? 1 : 2)} ${units[exponent]}`
}

const formatDateTime = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

const statusClass = (tone) => {
  if (tone === 'success') return 'status-pill-success'
  if (tone === 'danger') return 'status-pill-danger'
  if (tone === 'warm') return 'status-pill-warm'
  return 'status-pill-neutral'
}

const summaryCards = computed(() => [
  {
    label: 'admin.databaseStatus',
    badge: health.value.database.ok ? t('admin.healthy') : t('admin.degraded'),
    value: formatBytes(health.value.database.size_bytes),
    detail: `WAL ${formatBytes(health.value.database.wal_size_bytes)}`,
    tone: health.value.database.ok ? 'success' : 'danger'
  },
  {
    label: 'admin.databaseBackups',
    badge: `${health.value.backups.count || 0}`,
    value: health.value.backups.latest ? formatDateTime(health.value.backups.latest.updated_at) : t('admin.noBackupYet'),
    detail: health.value.backups.directory || '—',
    tone: health.value.backups.count ? 'neutral' : 'warm'
  },
  {
    label: 'admin.objectStorage',
    badge: health.value.object_storage.configured ? t('admin.connected') : t('admin.notConfigured'),
    value: health.value.object_storage.configured ? t('admin.immutableCache') : t('admin.r2NotConfigured'),
    detail: health.value.object_storage.cache_control || '—',
    tone: health.value.object_storage.configured ? 'success' : 'danger'
  },
  {
    label: 'admin.orphanImages',
    badge: `${assets.value.summary.total || 0}`,
    value: `${assets.value.summary.orphaned || 0}`,
    detail: `${t('admin.referencedImages')} ${assets.value.summary.referenced || 0}`,
    tone: assets.value.summary.orphaned ? 'warm' : 'success'
  }
])

const filteredAssets = computed(() => {
  const allAssets = assets.value.assets || []
  if (!showOrphansOnly.value) {
    return allAssets
  }

  return allAssets.filter(asset => !asset.referenced)
})

const loadHealth = async () => {
  isLoadingHealth.value = true
  try {
    health.value = await adminApi.getSystemHealth()
  } catch (error) {
    console.error('Failed to load system health:', error)
    alert(error.message || t('admin.loadFailed'))
  } finally {
    isLoadingHealth.value = false
  }
}

const loadAssets = async () => {
  isLoadingAssets.value = true
  try {
    assets.value = await adminApi.getSystemAssets()
  } catch (error) {
    console.error('Failed to load system assets:', error)
    alert(error.message || t('admin.refreshFailed'))
  } finally {
    isLoadingAssets.value = false
  }
}

const loadAll = async () => {
  await Promise.all([loadHealth(), loadAssets()])
}

const createBackup = async () => {
  isCreatingBackup.value = true
  try {
    const response = await adminApi.createSystemBackup()
    health.value.backups = response.backups || health.value.backups
    alert(t('admin.backupSuccess'))
  } catch (error) {
    console.error('Failed to create backup:', error)
    alert(error.message || t('admin.backupFailed'))
  } finally {
    isCreatingBackup.value = false
  }
}

const clearBrowserAssetCache = async (assetUrl) => {
  if (!assetUrl || typeof window === 'undefined' || typeof caches === 'undefined') {
    return
  }

  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map(async cacheName => {
    const cache = await caches.open(cacheName)
    await cache.delete(assetUrl, { ignoreSearch: true })
    await cache.delete(decodeURIComponent(assetUrl), { ignoreSearch: true })
  }))
}

const deleteAsset = async (asset) => {
  if (!asset.can_delete) {
    alert(t('admin.deleteBlockedByReference'))
    return
  }

  if (!confirm(t('admin.confirmDelete'))) {
    return
  }

  deletingKey.value = asset.key
  try {
    const response = await adminApi.deleteSystemAsset(asset.key)
    await clearBrowserAssetCache(response.asset?.url || asset.url)
    await Promise.all([loadAssets(), loadHealth()])
    alert(t('admin.deleteSuccess'))
  } catch (error) {
    console.error('Failed to delete asset:', error)
    if (error.status === 409) {
      alert(t('admin.deleteBlockedByReference'))
    } else {
      alert(error.message || t('admin.deleteFailed'))
    }
  } finally {
    deletingKey.value = ''
  }
}

onMounted(() => {
  loadAll()
})
</script>
