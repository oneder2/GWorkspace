/**
 * 图标映射工具
 * 将图标名称字符串映射到实际的图标组件
 */

import HomeIcon from '../components/icons/HomeIcon.vue'
import CompassIcon from '../components/icons/CompassIcon.vue'
import WrenchIcon from '../components/icons/WrenchIcon.vue'
import ArticleIcon from '../components/icons/ArticleIcon.vue'
import BriefcaseIcon from '../components/icons/BriefcaseIcon.vue'
import GoogleIcon from '../components/icons/GoogleIcon.vue'
import DuckIcon from '../components/icons/DuckIcon.vue'
import GitHubIcon from '../components/icons/GitHubIcon.vue'
import YouTubeIcon from '../components/icons/YouTubeIcon.vue'
import GmailIcon from '../components/icons/GmailIcon.vue'
import TwitterIcon from '../components/icons/TwitterIcon.vue'
import GeminiIcon from '../components/icons/GeminiIcon.vue'
import CodeIcon from '../components/icons/CodeIcon.vue'
import PaintIcon from '../components/icons/PaintIcon.vue'
import BookIcon from '../components/icons/BookIcon.vue'
import LayoutIcon from '../components/icons/LayoutIcon.vue'
import ShoppingIcon from '../components/icons/ShoppingIcon.vue'
import ClockIcon from '../components/icons/ClockIcon.vue'
import CalculatorIcon from '../components/icons/CalculatorIcon.vue'
import TranslateIcon from '../components/icons/TranslateIcon.vue'
import FileCodeIcon from '../components/icons/FileCodeIcon.vue'
import StopwatchIcon from '../components/icons/StopwatchIcon.vue'
import TimerIcon from '../components/icons/TimerIcon.vue'

/**
 * 图标名称到组件的映射
 */
const iconMap = {
  HomeIcon,
  CompassIcon,
  WrenchIcon,
  ArticleIcon,
  BriefcaseIcon,
  GoogleIcon,
  DuckIcon,
  GitHubIcon,
  YouTubeIcon,
  GmailIcon,
  TwitterIcon,
  GeminiIcon,
  CodeIcon,
  PaintIcon,
  BookIcon,
  LayoutIcon,
  ShoppingIcon,
  ClockIcon,
  CalculatorIcon,
  TranslateIcon,
  FileCodeIcon,
  StopwatchIcon,
  TimerIcon,
}

/**
 * 根据图标名称获取图标组件
 * @param {string} iconName - 图标名称
 * @returns {Object|null} 图标组件或null
 */
export function getIcon(iconName) {
  return iconMap[iconName] || null
}
