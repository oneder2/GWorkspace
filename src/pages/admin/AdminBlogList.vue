<!--
  博客管理列表页面
  显示所有博客，支持编辑、删除、发布/下架
-->
<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.blogs') }}</h2>
      <router-link
        to="/admin/blogs/new"
        class="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-semibold flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {{ $t('admin.createBlog') }}
      </router-link>
    </div>

    <!-- 博客列表 -->
    <div class="glass-card rounded-2xl overflow-hidden">
      <div v-if="isLoading" class="p-8 text-center text-slate-500 dark:text-slate-400">
        {{ $t('common.loading') }}
      </div>
      <div v-else-if="blogs.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400">
        {{ $t('admin.noBlogs') }}
      </div>
      <table v-else class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{{ $t('admin.title') }}</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{{ $t('admin.status') }}</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{{ $t('admin.views') }}</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{{ $t('admin.date') }}</th>
            <th class="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{{ $t('admin.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
          <tr
            v-for="blog in blogs"
            :key="blog.id"
            class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
          >
            <td class="px-6 py-4">
              <div class="font-semibold text-slate-800 dark:text-slate-200">{{ blog.title }}</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">{{ blog.genre }}</div>
            </td>
            <td class="px-6 py-4">
              <span
                class="px-2 py-1 text-xs font-semibold rounded-full"
                :class="blog.status === 'published'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
              >
                {{ blog.status === 'published' ? $t('admin.published') : $t('admin.draft') }}
              </span>
            </td>
            <td class="px-6 py-4 text-slate-600 dark:text-slate-400">
              {{ blog.views || 0 }}
            </td>
            <td class="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
              {{ blog.published_at ? new Date(blog.published_at).toLocaleDateString() : '-' }}
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="editBlog(blog.id)"
                  class="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  :title="$t('admin.edit')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  @click="deleteBlog(blog.id)"
                  class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  :title="$t('admin.delete')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { blogApi } from '../../utils/api'

const router = useRouter()
const { t } = useI18n()

const blogs = ref([])
const isLoading = ref(false)

/**
 * 加载博客列表
 */
const loadBlogs = async () => {
  isLoading.value = true
  try {
    // 获取所有博客（包括草稿）
    const allBlogs = await blogApi.getList({ status: 'all' })
    blogs.value = allBlogs || []
  } catch (error) {
    console.error('Failed to load blogs:', error)
    blogs.value = []
  } finally {
    isLoading.value = false
  }
}

/**
 * 编辑博客
 */
const editBlog = (id) => {
  router.push(`/admin/blogs/${id}`)
}

/**
 * 删除博客
 */
const deleteBlog = async (id) => {
  if (!confirm(t('admin.confirmDelete'))) {
    return
  }

  try {
    await blogApi.delete(id)
    await loadBlogs()
  } catch (error) {
    console.error('Failed to delete blog:', error)
    alert(t('admin.deleteFailed'))
  }
}

onMounted(() => {
  loadBlogs()
})
</script>

