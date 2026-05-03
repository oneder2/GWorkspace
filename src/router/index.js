/**
 * 路由配置文件
 * 定义应用的所有路由规则
 * 使用懒加载优化性能，减少初始包大小
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { i18n } from '../i18n/index.js'

/**
 * 路由懒加载函数
 * 使用动态 import 实现代码分割，提升首屏加载速度
 */
const HomePage = () => import('../pages/HomePage.vue')
const SitesPage = () => import('../pages/SitesPage.vue')
const ToolsPage = () => import('../pages/ToolsPage.vue')
const BlogPage = () => import('../pages/BlogPage.vue')
const BlogDetailPage = () => import('../pages/BlogDetailPage.vue')
const PortfolioPage = () => import('../pages/PortfolioPage.vue')

// 管理后台路由 - 按需加载，减少初始包大小
const AdminLayout = () => import('../pages/admin/AdminLayout.vue')
const AdminDashboard = () => import('../pages/admin/AdminDashboard.vue')
const AdminBlogList = () => import('../pages/admin/AdminBlogList.vue')
const AdminBlogEditorPage = () => import('../pages/admin/AdminBlogEditorPage.vue')
const AdminAnalytics = () => import('../pages/admin/AdminAnalytics.vue')
const AdminAiStudio = () => import('../pages/admin/AdminAiStudio.vue')
const AdminComments = () => import('../pages/admin/AdminComments.vue')
const AdminGuestbook = () => import('../pages/admin/AdminGuestbook.vue')
const AdminSystem = () => import('../pages/admin/AdminSystem.vue')

/**
 * 路由配置
 * 支持URL路由和浏览器前进后退
 */
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
    meta: { titleKey: 'routes.home' }
  },
  {
    path: '/sites',
    name: 'sites',
    component: SitesPage,
    meta: { titleKey: 'routes.sites' }
  },
  {
    path: '/tools',
    name: 'tools',
    component: ToolsPage,
    meta: { titleKey: 'routes.tools' }
  },
  {
    path: '/blog',
    name: 'blog',
    component: BlogPage,
    meta: { titleKey: 'routes.blog' }
  },
  {
    path: '/blog/:id',
    name: 'blog-detail',
    component: BlogDetailPage,
    meta: { titleKey: 'routes.blogDetail' },
    props: true
  },
  {
    path: '/portfolio',
    name: 'portfolio',
    component: PortfolioPage,
    meta: { titleKey: 'routes.portfolio' }
  },
  // 管理后台路由
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: AdminDashboard,
        meta: { titleKey: 'admin.routeTitles.dashboard' }
      },
      {
        path: 'blogs',
        name: 'admin-blogs',
        component: AdminBlogList,
        meta: { titleKey: 'admin.routeTitles.blogs' }
      },
      {
        path: 'blogs/new',
        name: 'admin-blog-new',
        component: AdminBlogEditorPage,
        meta: { titleKey: 'admin.routeTitles.newBlog' }
      },
      {
        path: 'blogs/:id',
        name: 'admin-blog-edit',
        component: AdminBlogEditorPage,
        meta: { titleKey: 'admin.routeTitles.editBlog' },
        props: true
      },
      {
        path: 'analytics',
        name: 'admin-analytics',
        component: AdminAnalytics,
        meta: { titleKey: 'admin.routeTitles.analytics' }
      },
      {
        path: 'ai',
        name: 'admin-ai',
        component: AdminAiStudio,
        meta: { titleKey: 'admin.routeTitles.ai' }
      },
      {
        path: 'comments',
        name: 'admin-comments',
        component: AdminComments,
        meta: { titleKey: 'admin.routeTitles.comments' }
      },
      {
        path: 'guestbook',
        name: 'admin-guestbook',
        component: AdminGuestbook,
        meta: { titleKey: 'admin.routeTitles.guestbook' }
      },
      {
        path: 'system',
        name: 'admin-system',
        component: AdminSystem,
        meta: { titleKey: 'admin.routeTitles.system' }
      }
    ]
  },
  // 404 重定向到首页
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 滚动行为：切换路由时滚动到顶部
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

/**
 * 路由守卫：更新页面标题
 */
router.beforeEach(async (to, from, next) => {
  // 根据路由 meta 更新标题
  if (to.meta.titleKey) {
    document.title = `${i18n.global.t(to.meta.titleKey)} - GWorkspace`
  } else {
    document.title = i18n.global.t('seo.siteTitle')
  }

  const { user, isAdmin, authReady } = useAuth()
  await authReady

  if (to.meta.requiresAuth && !user.value) {
    next('/blog')
    return
  }

  if (to.meta.requiresAdmin && !isAdmin.value) {
    next('/blog')
    return
  }

  next()
})

export default router
