/**
 * 应用入口文件
 * 初始化Vue应用，配置全局插件和样式
 */
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import './style.css'

// 创建Vue应用实例
const app = createApp(App)

// 注册国际化插件
app.use(i18n)

// 挂载应用
app.mount('#app')
