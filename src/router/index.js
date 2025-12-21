/**
 * 路由配置文件
 * 定义应用的所有路由规则
 * 使用懒加载优化性能，减少初始包大小
 */
import { createRouter, createWebHistory } from 'vue-router'

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
const AdminComments = () => import('../pages/admin/AdminComments.vue')

/**
 * 路由配置
 * 支持URL路由和浏览器前进后退
 */
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
    meta: { title: 'Home' }
  },
  {
    path: '/sites',
    name: 'sites',
    component: SitesPage,
    meta: { title: 'Sites' }
  },
  {
    path: '/tools',
    name: 'tools',
    component: ToolsPage,
    meta: { title: 'Tools' }
  },
  {
    path: '/blog',
    name: 'blog',
    component: BlogPage,
    meta: { title: 'Blog' }
  },
  {
    path: '/blog/:id',
    name: 'blog-detail',
    component: BlogDetailPage,
    meta: { title: 'Blog Detail' },
    props: true
  },
  {
    path: '/portfolio',
    name: 'portfolio',
    component: PortfolioPage,
    meta: { title: 'Portfolio' }
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
        meta: { title: 'Admin Dashboard' }
      },
      {
        path: 'blogs',
        name: 'admin-blogs',
        component: AdminBlogList,
        meta: { title: 'Blog Management' }
      },
      {
        path: 'blogs/new',
        name: 'admin-blog-new',
        component: AdminBlogEditorPage,
        meta: { title: 'New Blog' }
      },
      {
        path: 'blogs/:id',
        name: 'admin-blog-edit',
        component: AdminBlogEditorPage,
        meta: { title: 'Edit Blog' },
        props: true
      },
      {
        path: 'analytics',
        name: 'admin-analytics',
        component: AdminAnalytics,
        meta: { title: 'Analytics' }
      },
      {
        path: 'comments',
        name: 'admin-comments',
        component: AdminComments,
        meta: { title: 'Comments' }
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
router.beforeEach((to, from, next) => {
  // 根据路由 meta 更新标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - GWorkspace`
  } else {
    document.title = 'GWorkspace - Personal Workspace'
  }
  next()
})

export default router
