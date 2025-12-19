/**
 * 快捷键配置
 * 定义应用的全局键盘快捷键
 */

export const shortcutsConfig = [
  {
    key: 'k',
    ctrl: true,
    meta: true, // Cmd on Mac
    description: '快速搜索/命令面板',
    action: 'openCommandPalette'
  },
  {
    key: '1',
    ctrl: true,
    meta: true,
    description: '切换到首页',
    action: 'navigate',
    route: '/'
  },
  {
    key: '2',
    ctrl: true,
    meta: true,
    description: '切换到站点导航',
    action: 'navigate',
    route: '/sites'
  },
  {
    key: '3',
    ctrl: true,
    meta: true,
    description: '切换到工具箱',
    action: 'navigate',
    route: '/tools'
  },
  {
    key: '4',
    ctrl: true,
    meta: true,
    description: '切换到博客',
    action: 'navigate',
    route: '/blog'
  },
  {
    key: '5',
    ctrl: true,
    meta: true,
    description: '切换到作品集',
    action: 'navigate',
    route: '/portfolio'
  },
  {
    key: 'b',
    ctrl: true,
    meta: true,
    description: '切换侧边栏',
    action: 'toggleSidebar'
  },
  {
    key: 'd',
    ctrl: true,
    meta: true,
    description: '切换暗色模式',
    action: 'toggleTheme'
  },
  {
    key: 'Escape',
    description: '关闭弹窗/菜单',
    action: 'closeModal'
  }
]
