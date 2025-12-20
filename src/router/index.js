/**
 * 路由配置文件
 * 定义应用的所有路由规则
 */
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import SitesPage from '../pages/SitesPage.vue'
import ToolsPage from '../pages/ToolsPage.vue'
import BlogPage from '../pages/BlogPage.vue'
import BlogDetailPage from '../pages/BlogDetailPage.vue'
import PortfolioPage from '../pages/PortfolioPage.vue'
import AdminLayout from '../pages/admin/AdminLayout.vue'
import AdminDashboard from '../pages/admin/AdminDashboard.vue'
import AdminBlogList from '../pages/admin/AdminBlogList.vue'
import AdminBlogEditorPage from '../pages/admin/AdminBlogEditorPage.vue'
import AdminAnalytics from '../pages/admin/AdminAnalytics.vue'
import AdminComments from '../pages/admin/AdminComments.vue'

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
  routes
})

export default router
