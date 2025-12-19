<!--
  计算器工具组件
  提供基本的数学计算功能
-->
<template>
  <div class="h-full flex items-center justify-center">
    <div class="bg-white dark:bg-slate-800/90 p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md md:max-w-lg border border-slate-200 dark:border-slate-600/50">
      <!-- 显示屏 -->
      <div class="bg-slate-100 dark:bg-black/60 rounded-2xl p-4 mb-6 text-right border border-slate-300 dark:border-slate-600/30">
        <div class="text-slate-500 dark:text-slate-400 text-xs font-mono h-4">{{ calcHistory }}</div>
        <div class="text-slate-900 dark:text-slate-100 font-mono text-4xl h-12 flex items-end justify-end break-all tracking-wider">
          {{ calcDisplay }}
        </div>
      </div>
      
      <!-- 按钮网格 -->
      <div class="grid grid-cols-4 gap-3">
        <button 
          @click="calcClear" 
          class="col-span-1 h-14 rounded-xl bg-red-500/20 dark:bg-red-500/30 text-red-400 dark:text-red-300 font-bold hover:bg-red-500/30 dark:hover:bg-red-500/40 transition-colors border border-red-500/20 dark:border-red-500/30"
        >
          AC
        </button>
        <button 
          @click="calcAppend('/')" 
          class="h-14 rounded-xl bg-slate-100 dark:bg-slate-700/80 text-cyan-600 dark:text-cyan-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600/50"
        >
          ÷
        </button>
        <button 
          @click="calcAppend('*')" 
          class="h-14 rounded-xl bg-slate-100 dark:bg-slate-700/80 text-cyan-600 dark:text-cyan-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600/50"
        >
          ×
        </button>
        <button 
          @click="calcDelete" 
          class="h-14 rounded-xl bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 mx-auto">
            <path d="M22 6h-4l-3 4H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h12l3 4h4"/>
          </svg>
        </button>
        
        <button 
          v-for="n in [7,8,9]" 
          :key="n"
          @click="calcAppend(n)" 
          class="h-14 rounded-xl bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xl border border-slate-300 dark:border-slate-600/50"
        >
          {{ n }}
        </button>
        <button 
          @click="calcAppend('-')" 
          class="h-14 rounded-xl bg-slate-100 dark:bg-slate-700/80 text-cyan-600 dark:text-cyan-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600/50"
        >
          -
        </button>
        
        <button 
          v-for="n in [4,5,6]" 
          :key="n"
          @click="calcAppend(n)" 
          class="h-14 rounded-xl bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xl border border-slate-300 dark:border-slate-600/50"
        >
          {{ n }}
        </button>
        <button 
          @click="calcAppend('+')" 
          class="h-14 rounded-xl bg-slate-100 dark:bg-slate-700/80 text-cyan-600 dark:text-cyan-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600/50"
        >
          +
        </button>
        
        <button 
          v-for="n in [1,2,3]" 
          :key="n"
          @click="calcAppend(n)" 
          class="h-14 rounded-xl bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xl border border-slate-300 dark:border-slate-600/50"
        >
          {{ n }}
        </button>
        <button 
          @click="calcEqual" 
          class="row-span-2 h-[7.5rem] rounded-xl bg-gradient-to-b from-green-500 to-green-600 dark:from-green-500 dark:to-green-600 text-white font-bold hover:from-green-400 hover:to-green-500 dark:hover:from-green-400 dark:hover:to-green-500 shadow-lg shadow-green-500/20 dark:shadow-green-500/30 text-xl border border-green-400/20 dark:border-green-400/30"
        >
          =
        </button>
        
        <button 
          @click="calcAppend(0)" 
          class="col-span-2 h-14 rounded-xl bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xl border border-slate-300 dark:border-slate-600/50"
        >
          0
        </button>
        <button 
          @click="calcAppend('.')" 
          class="h-14 rounded-xl bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600/50"
        >
          .
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const calcDisplay = ref('0')
const calcHistory = ref('')

/**
 * 追加字符到计算器显示
 */
const calcAppend = (val) => {
  if (calcDisplay.value === '0' && val !== '.') calcDisplay.value = ''
  calcDisplay.value += val
}

/**
 * 清空计算器
 */
const calcClear = () => { 
  calcDisplay.value = '0'
  calcHistory.value = ''
}

/**
 * 删除最后一个字符
 */
const calcDelete = () => {
  calcDisplay.value = calcDisplay.value.slice(0, -1)
  if (calcDisplay.value === '') calcDisplay.value = '0'
}

/**
 * 计算结果
 * 注意：使用eval存在安全风险，生产环境应使用更安全的表达式解析器
 * TODO: 替换为安全的数学表达式解析库
 */
const calcEqual = () => {
  try {
    const res = eval(calcDisplay.value).toString()
    calcHistory.value = calcDisplay.value + ' ='
    calcDisplay.value = res
  } catch (e) {
    calcDisplay.value = 'Error'
    setTimeout(() => calcDisplay.value = '0', 1000)
  }
}
</script>
