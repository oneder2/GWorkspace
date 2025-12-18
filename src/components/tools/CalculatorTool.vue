<!--
  计算器工具组件
  提供基本的数学计算功能
-->
<template>
  <div class="h-full flex items-center justify-center">
    <div class="bg-slate-900 dark:bg-slate-800 p-6 rounded-3xl shadow-2xl w-full max-w-xs border border-slate-700/50 dark:border-slate-600/50 transform transition-transform hover:scale-105">
      <!-- 显示屏 -->
      <div class="bg-black/30 dark:bg-slate-900/50 rounded-2xl p-4 mb-6 text-right">
        <div class="text-slate-400 dark:text-slate-500 text-xs font-mono h-4">{{ calcHistory }}</div>
        <div class="text-white dark:text-slate-100 font-mono text-4xl h-12 flex items-end justify-end break-all tracking-wider">
          {{ calcDisplay }}
        </div>
      </div>
      
      <!-- 按钮网格 -->
      <div class="grid grid-cols-4 gap-3">
        <button 
          @click="calcClear" 
          class="col-span-1 h-14 rounded-xl bg-red-500/20 dark:bg-red-600/30 text-red-400 dark:text-red-300 font-bold hover:bg-red-500/30 dark:hover:bg-red-600/40 transition-colors"
        >
          AC
        </button>
        <button 
          @click="calcAppend('/')" 
          class="h-14 rounded-xl bg-slate-800 dark:bg-slate-700 text-cyan-400 dark:text-cyan-300 font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
        >
          ÷
        </button>
        <button 
          @click="calcAppend('*')" 
          class="h-14 rounded-xl bg-slate-800 dark:bg-slate-700 text-cyan-400 dark:text-cyan-300 font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
        >
          ×
        </button>
        <button 
          @click="calcDelete" 
          class="h-14 rounded-xl bg-slate-800 dark:bg-slate-700 text-slate-300 dark:text-slate-400 hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 mx-auto">
            <path d="M22 6h-4l-3 4H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h12l3 4h4"/>
          </svg>
        </button>
        
        <button 
          v-for="n in [7,8,9]" 
          :key="n"
          @click="calcAppend(n)" 
          class="h-14 rounded-xl bg-slate-800 dark:bg-slate-700 text-white dark:text-slate-100 font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors text-xl"
        >
          {{ n }}
        </button>
        <button 
          @click="calcAppend('-')" 
          class="h-14 rounded-xl bg-slate-800 dark:bg-slate-700 text-cyan-400 dark:text-cyan-300 font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
        >
          -
        </button>
        
        <button 
          v-for="n in [4,5,6]" 
          :key="n"
          @click="calcAppend(n)" 
          class="h-14 rounded-xl bg-slate-800 dark:bg-slate-700 text-white dark:text-slate-100 font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors text-xl"
        >
          {{ n }}
        </button>
        <button 
          @click="calcAppend('+')" 
          class="h-14 rounded-xl bg-slate-800 dark:bg-slate-700 text-cyan-400 dark:text-cyan-300 font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
        >
          +
        </button>
        
        <button 
          v-for="n in [1,2,3]" 
          :key="n"
          @click="calcAppend(n)" 
          class="h-14 rounded-xl bg-slate-800 dark:bg-slate-700 text-white dark:text-slate-100 font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors text-xl"
        >
          {{ n }}
        </button>
        <button 
          @click="calcEqual" 
          class="row-span-2 h-[7.5rem] rounded-xl bg-gradient-to-b from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white font-bold hover:from-green-400 hover:to-green-500 dark:hover:from-green-500 dark:hover:to-green-600 shadow-lg shadow-green-500/20 text-xl"
        >
          =
        </button>
        
        <button 
          @click="calcAppend(0)" 
          class="col-span-2 h-14 rounded-xl bg-slate-800 dark:bg-slate-700 text-white dark:text-slate-100 font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors text-xl"
        >
          0
        </button>
        <button 
          @click="calcAppend('.')" 
          class="h-14 rounded-xl bg-slate-800 dark:bg-slate-700 text-white dark:text-slate-100 font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
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
