<!--
  用户认证弹窗组件
  支持登录和注册功能
-->
<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4" @click.self="handleClose">
    <div class="glass-card-panel rounded-3xl p-6 md:p-8 w-full max-w-md overflow-hidden flex flex-col animate-fade-in">
      <!-- 头部 -->
      <div class="flex items-center justify-between mb-6 shrink-0">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">
          {{ isLogin ? $t('auth.login') : $t('auth.register') }}
        </h2>
        <button 
          @click="handleClose"
          class="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
          :title="$t('common.close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-slate-600 dark:text-slate-300">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="flex-1 space-y-4">
        <!-- 错误提示 -->
        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
          {{ error }}
        </div>

        <!-- 表单 -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- 用户名（注册时显示） -->
          <div v-if="!isLogin">
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {{ $t('auth.username') }} <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="formData.username"
              type="text"
              required
              class="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 transition-all"
              style="--focus-ring: color-mix(in srgb, var(--theme-primary) 50%, transparent);"
              @focus="$event.currentTarget.style.setProperty('--tw-ring-color', 'var(--focus-ring)')"
              @blur="$event.currentTarget.style.setProperty('--tw-ring-color', '')"
              :placeholder="$t('auth.usernamePlaceholder')"
            />
          </div>

          <!-- 邮箱（注册时显示） -->
          <div v-if="!isLogin">
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {{ $t('auth.email') }} <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="formData.email"
              type="email"
              required
              class="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 transition-all"
              style="--focus-ring: color-mix(in srgb, var(--theme-primary) 50%, transparent);"
              @focus="$event.currentTarget.style.setProperty('--tw-ring-color', 'var(--focus-ring)')"
              @blur="$event.currentTarget.style.setProperty('--tw-ring-color', '')"
              :placeholder="$t('auth.emailPlaceholder')"
            />
          </div>

          <!-- 用户名/邮箱（登录时） -->
          <div v-if="isLogin">
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {{ $t('auth.username') }} <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="formData.username"
              type="text"
              required
              class="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 transition-all"
              style="--focus-ring: color-mix(in srgb, var(--theme-primary) 50%, transparent);"
              @focus="$event.currentTarget.style.setProperty('--tw-ring-color', 'var(--focus-ring)')"
              @blur="$event.currentTarget.style.setProperty('--tw-ring-color', '')"
              :placeholder="$t('auth.usernamePlaceholder')"
            />
          </div>

          <!-- 密码 -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {{ $t('auth.password') }} <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="formData.password"
              type="password"
              required
              class="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 transition-all"
              style="--focus-ring: color-mix(in srgb, var(--theme-primary) 50%, transparent);"
              @focus="$event.currentTarget.style.setProperty('--tw-ring-color', 'var(--focus-ring)')"
              @blur="$event.currentTarget.style.setProperty('--tw-ring-color', '')"
              :placeholder="$t('auth.passwordPlaceholder')"
            />
          </div>

          <!-- 提交按钮 -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full px-4 py-2.5 text-white rounded-lg transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            :style="isThemeTransparent 
              ? (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
                  ? {
                      background: 'linear-gradient(to right, #64748b, #475569)',
                      boxShadow: '0 4px 6px -1px rgba(100, 116, 139, 0.3), 0 2px 4px -1px rgba(100, 116, 139, 0.2)'
                    }
                  : {
                      background: 'linear-gradient(to right, #475569, #334155)',
                      boxShadow: '0 4px 6px -1px rgba(71, 85, 105, 0.3), 0 2px 4px -1px rgba(71, 85, 105, 0.2)'
                    })
              : {
                  background: 'linear-gradient(to right, var(--theme-primary), var(--theme-primary-darker))',
                  boxShadow: '0 4px 6px -1px color-mix(in srgb, var(--theme-primary) 30%, transparent), 0 2px 4px -1px color-mix(in srgb, var(--theme-primary) 20%, transparent)'
                }"
            @mouseenter="handleButtonHoverEnter"
            @mouseleave="handleButtonHoverLeave"
          >
            <span v-if="isSubmitting" class="animate-spin">⏳</span>
            <span>{{ isSubmitting ? $t('common.processing') : (isLogin ? $t('auth.login') : $t('auth.register')) }}</span>
          </button>
        </form>

        <!-- 切换登录/注册 -->
        <div class="text-center text-sm text-slate-600 dark:text-slate-400">
          <span>{{ isLogin ? $t('auth.noAccount') : $t('auth.hasAccount') }}</span>
          <button
            @click="isLogin = !isLogin"
            class="ml-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:underline font-semibold transition-colors"
          >
            {{ isLogin ? $t('auth.register') : $t('auth.login') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'

const props = defineProps({
  defaultMode: {
    type: String,
    default: 'login', // 'login' or 'register'
    validator: (value) => ['login', 'register'].includes(value)
  }
})

const emit = defineEmits(['close', 'success'])

const { t } = useI18n()
const { login, register } = useAuth()

const isLogin = ref(props.defaultMode === 'login')
const isSubmitting = ref(false)
const error = ref('')

const formData = ref({
  username: '',
  email: '',
  password: ''
})

// 检查主题色是否为透明
const isThemeTransparent = ref(false)

/**
 * 检查主题色是否为透明
 */
const checkThemeTransparent = () => {
  if (typeof document !== 'undefined') {
    const themePrimary = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim()
    isThemeTransparent.value = themePrimary === 'transparent'
  }
}

// 切换模式时清空表单和错误
watch(isLogin, () => {
  formData.value = { username: '', email: '', password: '' }
  error.value = ''
})

/**
 * 处理表单提交
 */
const handleSubmit = async () => {
  error.value = ''
  isSubmitting.value = true

  try {
    let result
    if (isLogin.value) {
      result = await login({
        username: formData.value.username,
        password: formData.value.password
      })
    } else {
      result = await register({
        username: formData.value.username,
        email: formData.value.email,
        password: formData.value.password
      })
    }

    if (result.success) {
      emit('success', result.user)
      handleClose()
    } else {
      error.value = result.error || (isLogin.value ? t('auth.loginFailed') : t('auth.registerFailed'))
    }
  } catch (err) {
    error.value = err.message || (isLogin.value ? t('auth.loginFailed') : t('auth.registerFailed'))
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 关闭弹窗
 */
const handleClose = () => {
  emit('close')
}

// 初始化时检查主题色
onMounted(() => {
  checkThemeTransparent()
  
  // 监听主题色变化
  if (typeof document !== 'undefined') {
    const observer = new MutationObserver(() => {
      checkThemeTransparent()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    })
  }
})

/**
 * 处理按钮 hover 进入
 */
const handleButtonHoverEnter = (event) => {
  const el = event?.currentTarget
  if (el && !el.disabled) {
    if (isThemeTransparent.value) {
      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      // 暗色模式：使用较亮的灰色
      // 亮色模式：使用稍深的灰色
      el.style.background = isDark 
        ? 'linear-gradient(to right, #94a3b8, #64748b)'
        : 'linear-gradient(to right, #64748b, #475569)'
    } else {
      el.style.background = 'linear-gradient(to right, var(--theme-primary-light), var(--theme-primary))'
    }
  }
}

/**
 * 处理按钮 hover 离开
 */
const handleButtonHoverLeave = (event) => {
  const el = event?.currentTarget
  if (el && !el.disabled) {
    if (isThemeTransparent.value) {
      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      // 恢复默认状态
      el.style.background = isDark 
        ? 'linear-gradient(to right, #64748b, #475569)'
        : 'linear-gradient(to right, #475569, #334155)'
    } else {
      el.style.background = 'linear-gradient(to right, var(--theme-primary), var(--theme-primary-darker))'
    }
  }
}
</script>


