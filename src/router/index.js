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
