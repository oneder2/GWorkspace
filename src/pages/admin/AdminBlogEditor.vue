<!--
  管理后台博客编辑器
  复用BlogEditor组件，添加草稿保存功能
-->
<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">
        {{ isEditMode ? $t('admin.editBlog') : $t('admin.createBlog') }}
      </h2>
      <router-link
        to="/admin/blogs"
        class="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
      >
        {{ $t('common.cancel') }}
      </router-link>
    </div>

    <BlogEditor
      :is-edit-mode="isEditMode"
      :article="article"
      :existing-posts="[]"
      @close="handleClose"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BlogEditor from '../../components/BlogEditor.vue'
import { blogApi } from '../../utils/api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const article = ref(null)
const isEditMode = computed(() => !!route.params.id)

/**
 * 加载文章数据（编辑模式）
 */
const loadArticle = async () => {
  if (!isEditMode.value) return

  try {
    const id = parseInt(route.params.id)
    article.value = await blogApi.getById(id)
  } catch (error) {
    console.error('Failed to load article:', error)
    router.push('/admin/blogs')
  }
}

/**
 * 处理关闭
 */
const handleClose = () => {
  router.push('/admin/blogs')
}

/**
 * 处理成功
 */
const handleSuccess = () => {
  router.push('/admin/blogs')
}

onMounted(() => {
  if (isEditMode.value) {
    loadArticle()
  }
})
</script>


