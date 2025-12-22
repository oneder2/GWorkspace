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
          class="row-span-2 h-[7.5rem] rounded-xl text-white font-bold shadow-lg text-xl border transition-all"
          style="background: linear-gradient(to bottom, var(--theme-primary), var(--theme-primary-darker)); box-shadow: 0 10px 15px -3px color-mix(in srgb, var(--theme-primary) 20%, transparent), 0 4px 6px -2px color-mix(in srgb, var(--theme-primary) 30%, transparent); border-color: color-mix(in srgb, var(--theme-primary-light) 20%, transparent);"
          @mouseenter="$event.currentTarget.style.background = 'linear-gradient(to bottom, var(--theme-primary-light), var(--theme-primary))'"
          @mouseleave="$event.currentTarget.style.background = 'linear-gradient(to bottom, var(--theme-primary), var(--theme-primary-darker))'"
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
 * 安全的数学表达式计算
 * 手动解析表达式，只支持基本的四则运算，完全避免eval和Function
 * @param {string} expression - 数学表达式字符串
 * @returns {number} 计算结果
 */
const safeCalculate = (expression) => {
  try {
    // 将显示的操作符转换为标准操作符
    let expr = expression.replace(/×/g, '*').replace(/÷/g, '/')
    
    // 移除所有空格
    expr = expr.replace(/\s/g, '')
    
    // 验证表达式只包含数字、运算符和小数点
    if (!/^[0-9+\-*/.]+$/.test(expr)) {
      throw new Error('Invalid characters')
    }
    
    // 使用正则表达式匹配数字（包括小数）和运算符
    // 处理负数开头的情况
    const tokens = []
    let i = 0
    while (i < expr.length) {
      if (expr[i] >= '0' && expr[i] <= '9' || expr[i] === '.') {
        // 匹配数字（包括小数）
        let num = ''
        while (i < expr.length && (expr[i] >= '0' && expr[i] <= '9' || expr[i] === '.')) {
          num += expr[i]
          i++
        }
        tokens.push(parseFloat(num))
      } else if (expr[i] === '+' || expr[i] === '-' || expr[i] === '*' || expr[i] === '/') {
        tokens.push(expr[i])
        i++
      } else {
        i++
      }
    }
    
    if (tokens.length === 0) {
      throw new Error('Invalid expression')
    }
    
    // 处理负数开头的情况
    if (tokens[0] === '-' && tokens.length > 1) {
      tokens[1] = -tokens[1]
      tokens.shift()
    }
    
    // 先处理乘除（从左到右）
    const processMulDiv = (tokens) => {
      const result = []
      let i = 0
      while (i < tokens.length) {
        if (typeof tokens[i] === 'number') {
          result.push(tokens[i])
          i++
        } else if (tokens[i] === '*' || tokens[i] === '/') {
          const op = tokens[i]
          const prev = result.pop()
          i++
          const next = tokens[i]
          if (typeof next !== 'number') {
            throw new Error('Invalid expression')
          }
          if (op === '*') {
            result.push(prev * next)
          } else {
            if (next === 0) throw new Error('Division by zero')
            result.push(prev / next)
          }
          i++
        } else {
          result.push(tokens[i])
          i++
        }
      }
      return result
    }
    
    // 处理加减（从左到右）
    const processAddSub = (tokens) => {
      let result = tokens[0]
      if (typeof result !== 'number') {
        throw new Error('Invalid expression')
      }
      for (let i = 1; i < tokens.length; i += 2) {
        const op = tokens[i]
        const num = tokens[i + 1]
        if (typeof num !== 'number') {
          throw new Error('Invalid expression')
        }
        if (op === '+') {
          result += num
        } else if (op === '-') {
          result -= num
        } else {
          throw new Error('Invalid operator')
        }
      }
      return result
    }
    
    // 先处理乘除，再处理加减
    const afterMulDiv = processMulDiv(tokens)
    return processAddSub(afterMulDiv)
  } catch (e) {
    throw new Error('Invalid expression')
  }
}

/**
 * 计算结果
 * 使用安全的数学表达式计算函数，完全避免eval
 */
const calcEqual = () => {
  try {
    const res = safeCalculate(calcDisplay.value)
    
    // 处理结果，保留合理的小数位数
    let result = res.toString()
    if (result.includes('.')) {
      // 限制小数位数为10位，避免过长
      const parts = result.split('.')
      if (parts[1] && parts[1].length > 10) {
        result = res.toFixed(10).replace(/\.?0+$/, '')
      }
    }
    
    calcHistory.value = calcDisplay.value + ' ='
    calcDisplay.value = result
  } catch (e) {
    calcDisplay.value = 'Error'
    setTimeout(() => calcDisplay.value = '0', 1000)
  }
}
</script>
