<!--
  GWorkspace 图标组件
  支持不同颜色和样式变体
  动态加载 src/static/icon.svg 文件
-->
<template>
  <div 
    v-html="svgContent" 
    :style="{ width: size + 'px', height: size + 'px', display: 'inline-block' }"
    :class="svgClass"
  ></div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  size: {
    type: [String, Number],
    default: 24
  },
  variant: {
    type: String,
    default: 'default', // 'default', 'white', 'green', 'black', 'monochrome'
    validator: (value) => ['default', 'white', 'green', 'black', 'monochrome'].includes(value)
  },
  viewBox: {
    type: String,
    default: '0 0 1024 1024'
  }
})

const rawSvgContent = ref('')
const svgContent = ref('')

/**
 * 根据变体获取填充颜色
 */
const fillColor = computed(() => {
  switch (props.variant) {
    case 'white':
      return '#ffffff' // 白色
    case 'green':
      return '#10B981' // green-500
    case 'black':
      return '#000000' // 纯黑色
    case 'monochrome':
      return 'currentColor'
    default:
      return 'currentColor'
  }
})

/**
 * SVG 类名和样式
 */
const svgClass = computed(() => {
  const classes = []
  if (props.variant === 'monochrome') {
    classes.push('text-slate-800 dark:text-slate-200')
  }
  return classes.join(' ')
})

/**
 * 加载 SVG 文件并应用颜色
 */
const loadSvg = async () => {
  try {
    // 使用 Vite 的 ?raw 导入来获取 SVG 文件内容
    const svgModule = await import('../../static/icon.svg?raw')
    rawSvgContent.value = svgModule.default
    
    // 解析 SVG 并应用颜色
    applyColorToSvg()
  } catch (error) {
    console.error('Failed to load icon.svg:', error)
    // 如果加载失败，使用空内容
    svgContent.value = ''
  }
}

/**
 * 将颜色应用到 SVG
 */
const applyColorToSvg = () => {
  if (!rawSvgContent.value) return
  
  try {
    // 使用 DOMParser 解析 SVG
    const parser = new DOMParser()
    const doc = parser.parseFromString(rawSvgContent.value, 'image/svg+xml')
    
    // 检查解析错误
    const parserError = doc.querySelector('parsererror')
    if (parserError) {
      throw new Error('SVG parsing failed')
    }
    
    const svgElement = doc.querySelector('svg')
    if (!svgElement) {
      throw new Error('No SVG element found')
    }
    
    // 提取 viewBox
    const svgViewBox = svgElement.getAttribute('viewBox') || props.viewBox
    
    // 提取所有 path 元素
    const paths = doc.querySelectorAll('path')
    const pathDataArray = []
    
    paths.forEach(path => {
      const d = path.getAttribute('d')
      if (d) {
        pathDataArray.push(d)
      }
    })
    
    if (pathDataArray.length > 0) {
      // 创建新的 SVG，应用颜色和尺寸
      const pathElements = pathDataArray.map(pathData => 
        `<path fill="${fillColor.value}" stroke="none" d="${pathData}" />`
      ).join('\n        ')
      
      svgContent.value = `
        <svg 
          width="${props.size}" 
          height="${props.size}" 
          viewBox="${svgViewBox}"
          xmlns="http://www.w3.org/2000/svg"
          style="display: block;"
        >
          ${pathElements}
        </svg>
      `
    } else {
      // 如果没有找到 path，使用原始 SVG 但替换颜色
      let processedSvg = rawSvgContent.value
      processedSvg = processedSvg.replace(/style=["'][^"']*fill:[^"']*["']/g, `fill="${fillColor.value}"`)
      processedSvg = processedSvg.replace(/fill=["'][^"']*["']/g, `fill="${fillColor.value}"`)
      processedSvg = processedSvg.replace(/<svg([^>]*)>/, `<svg width="${props.size}" height="${props.size}" viewBox="${svgViewBox}" $1>`)
      svgContent.value = processedSvg
    }
  } catch (error) {
    console.error('Failed to process SVG:', error)
    // 如果解析失败，使用空内容
    svgContent.value = ''
  }
}

// 监听 variant 和 size 变化，重新应用颜色
watch([() => props.variant, () => props.size], () => {
  if (rawSvgContent.value) {
    applyColorToSvg()
  }
})

onMounted(() => {
  loadSvg()
})
</script>

