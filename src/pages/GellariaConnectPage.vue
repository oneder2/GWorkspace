<template>
  <section class="min-h-full grid place-items-center px-5 py-12">
    <div class="surface-card w-full max-w-xl rounded-[28px] border border-border-base p-7 sm:p-10 text-center">
      <p class="text-xs font-semibold tracking-[0.16em] text-muted">GWORKSPACE / GELLARIA</p>
      <h1 class="mt-4 text-3xl sm:text-4xl font-semibold text-main">连接你的灵体档案</h1>
      <p class="mx-auto mt-4 max-w-md text-sm leading-7 text-secondary">
        {{ statusText }}
      </p>

      <div class="mt-7 flex flex-col sm:flex-row justify-center gap-3">
        <button
          v-if="!user"
          class="px-5 py-3 rounded-2xl bg-[color:var(--theme-primary)] text-white font-semibold"
          @click="showAuthModal = true"
        >
          登录 GWorkspace
        </button>
        <button
          v-else
          class="px-5 py-3 rounded-2xl bg-[color:var(--theme-primary)] text-white font-semibold disabled:opacity-50"
          :disabled="connecting"
          @click="connect"
        >
          {{ connecting ? '正在连接' : '返回 Gellaria' }}
        </button>
        <RouterLink class="px-5 py-3 rounded-2xl border border-border-base text-secondary" to="/">
          返回主站
        </RouterLink>
      </div>

      <p v-if="error" class="mt-5 text-sm text-red-500">{{ error }}</p>
    </div>

    <AuthModal
      v-if="showAuthModal"
      default-mode="login"
      @close="showAuthModal = false"
      @success="handleAuthSuccess"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AuthModal from '../components/AuthModal.vue'
import { useAuth } from '../composables/useAuth'
import { gellariaApi } from '../utils/api'

const route = useRoute()
const { user, authReady } = useAuth()
const showAuthModal = ref(false)
const connecting = ref(false)
const error = ref('')

const statusText = computed(() => user.value
  ? `已登录为 ${user.value.username}。继续后，你的灵体配色和形态会保存到 GWorkspace。`
  : '登录后可以跨浏览器保留灵体形象；不登录时，形象只保存在当前浏览器。')

function fallbackDestination() {
  return import.meta.env.VITE_GELLARIA_URL || (import.meta.env.PROD
    ? 'https://gellaria.64-83-15-226.nip.io/explore'
    : 'http://localhost:3000/explore')
}

function safeDestination() {
  const fallback = fallbackDestination()
  if (typeof route.query.return !== 'string') return fallback
  try {
    const candidate = new URL(route.query.return)
    const allowed = candidate.origin === window.location.origin ||
      candidate.origin === 'https://gellaria.64-83-15-226.nip.io' ||
      ['localhost', '127.0.0.1'].includes(candidate.hostname)
    return allowed ? candidate.toString() : fallback
  } catch {
    return fallback
  }
}

async function connect() {
  if (!user.value || connecting.value) return
  connecting.value = true
  error.value = ''
  try {
    const handoff = await gellariaApi.createHandoff()
    const destination = new URL(safeDestination())
    destination.searchParams.set('handoff', handoff.code)
    window.location.assign(destination.toString())
  } catch (requestError) {
    error.value = requestError.message || '暂时无法连接 Gellaria。'
    connecting.value = false
  }
}

function handleAuthSuccess() {
  showAuthModal.value = false
  connect()
}

onMounted(async () => {
  await authReady
  if (user.value) connect()
})
</script>
