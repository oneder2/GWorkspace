<template>
  <div class="scientific-calculator">
    <div class="calculator-shell">
      <div class="calculator-display">
        <span class="calculator-history">{{ expression || $t('calculator.hint') }}</span>
        <strong class="calculator-result">{{ displayValue }}</strong>
      </div>

      <div class="calculator-grid">
        <button
          v-for="button in buttons"
          :key="button.label"
          type="button"
          class="calculator-key"
          :class="button.variant ? `calculator-key-${button.variant}` : ''"
          @click="handleButton(button)"
        >
          {{ button.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const expression = ref('')
const displayValue = ref('0')

const buttons = [
  { label: 'AC', action: 'clear', variant: 'danger' },
  { label: '⌫', action: 'delete' },
  { label: '(', value: '(' },
  { label: ')', value: ')' },
  { label: 'sin', value: 'sin(' },
  { label: 'cos', value: 'cos(' },
  { label: 'tan', value: 'tan(' },
  { label: '÷', value: '/' },
  { label: 'log', value: 'log(' },
  { label: 'ln', value: 'ln(' },
  { label: '√', value: 'sqrt(' },
  { label: '×', value: '*' },
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
  { label: '-', value: '-' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '+', value: '+' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '^', value: '^' },
  { label: '0', value: '0' },
  { label: '.', value: '.' },
  { label: '%', value: '%' },
  { label: '=', action: 'equals', variant: 'primary' },
  { label: 'π', value: 'pi' },
  { label: 'e', value: 'e' }
]

function handleButton(button) {
  if (button.action === 'clear') {
    expression.value = ''
    displayValue.value = '0'
    return
  }

  if (button.action === 'delete') {
    expression.value = expression.value.slice(0, -1)
    displayValue.value = expression.value || '0'
    return
  }

  if (button.action === 'equals') {
    calculate()
    return
  }

  expression.value += button.value
  displayValue.value = expression.value
}

function calculate() {
  try {
    const parser = new ExpressionParser(expression.value)
    const result = parser.parse()
    if (!Number.isFinite(result)) throw new Error('Invalid result')
    displayValue.value = formatResult(result)
    expression.value = displayValue.value
  } catch (error) {
    displayValue.value = t('calculator.error')
  }
}

function formatResult(value) {
  if (Number.isInteger(value)) return String(value)
  return Number(value.toPrecision(12)).toString()
}

class ExpressionParser {
  constructor(input) {
    this.input = input.replace(/\s/g, '').replace(/×/g, '*').replace(/÷/g, '/')
    this.index = 0
  }

  parse() {
    const value = this.parseExpression()
    if (this.index < this.input.length) throw new Error('Unexpected token')
    return value
  }

  parseExpression() {
    let value = this.parseTerm()
    while (this.match('+') || this.match('-')) {
      const operator = this.previous()
      const right = this.parseTerm()
      value = operator === '+' ? value + right : value - right
    }
    return value
  }

  parseTerm() {
    let value = this.parsePower()
    while (this.match('*') || this.match('/')) {
      const operator = this.previous()
      const right = this.parsePower()
      if (operator === '/' && right === 0) throw new Error('Division by zero')
      value = operator === '*' ? value * right : value / right
    }
    return value
  }

  parsePower() {
    let value = this.parseUnary()
    while (this.match('^')) {
      value = Math.pow(value, this.parseUnary())
    }
    return value
  }

  parseUnary() {
    if (this.match('+')) return this.parseUnary()
    if (this.match('-')) return -this.parseUnary()
    return this.parsePercent()
  }

  parsePercent() {
    let value = this.parsePrimary()
    while (this.match('%')) {
      value /= 100
    }
    return value
  }

  parsePrimary() {
    if (this.match('(')) {
      const value = this.parseExpression()
      if (!this.match(')')) throw new Error('Missing closing parenthesis')
      return value
    }

    if (this.isAlpha(this.peek())) {
      const name = this.readName()
      if (name === 'pi') return Math.PI
      if (name === 'e') return Math.E
      if (!this.match('(')) throw new Error('Missing function parenthesis')
      const value = this.parseExpression()
      if (!this.match(')')) throw new Error('Missing closing parenthesis')
      return this.applyFunction(name, value)
    }

    return this.readNumber()
  }

  applyFunction(name, value) {
    const degrees = value * Math.PI / 180
    const functions = {
      sin: () => Math.sin(degrees),
      cos: () => Math.cos(degrees),
      tan: () => Math.tan(degrees),
      sqrt: () => Math.sqrt(value),
      log: () => Math.log10(value),
      ln: () => Math.log(value)
    }

    if (!functions[name]) throw new Error('Unknown function')
    return functions[name]()
  }

  readNumber() {
    const start = this.index
    while (this.isDigit(this.peek()) || this.peek() === '.') {
      this.index += 1
    }

    if (start === this.index) throw new Error('Expected number')
    const value = Number(this.input.slice(start, this.index))
    if (!Number.isFinite(value)) throw new Error('Invalid number')
    return value
  }

  readName() {
    const start = this.index
    while (this.isAlpha(this.peek())) {
      this.index += 1
    }
    return this.input.slice(start, this.index)
  }

  match(char) {
    if (this.peek() !== char) return false
    this.index += 1
    return true
  }

  previous() {
    return this.input[this.index - 1]
  }

  peek() {
    return this.input[this.index] || ''
  }

  isDigit(char) {
    return char >= '0' && char <= '9'
  }

  isAlpha(char) {
    return /^[a-z]$/i.test(char)
  }
}
</script>

<style scoped>
.scientific-calculator {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}

.calculator-shell {
  display: grid;
  gap: 0.9rem;
  width: min(100%, 34rem);
  padding: 1rem;
  border-radius: 1.35rem;
  border: 1px solid var(--border-base);
  background: rgba(255, 255, 255, 0.52);
}

.dark .calculator-shell {
  background: rgba(15, 23, 42, 0.38);
}

.calculator-display {
  display: grid;
  gap: 0.35rem;
  min-height: 6.6rem;
  padding: 0.9rem;
  border-radius: 1rem;
  text-align: right;
  border: 1px solid var(--border-base);
  background: rgba(255, 255, 255, 0.5);
}

.dark .calculator-display {
  background: rgba(2, 6, 23, 0.32);
}

.calculator-history {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 720;
  word-break: break-all;
}

.calculator-result {
  align-self: end;
  color: var(--text-main);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: clamp(1.8rem, 6vw, 3rem);
  line-height: 1.05;
  word-break: break-all;
}

.calculator-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
}

.calculator-key {
  min-height: 3rem;
  border-radius: 0.86rem;
  border: 1px solid var(--border-base);
  background: rgba(255, 255, 255, 0.5);
  color: var(--text-main);
  font-size: 0.94rem;
  font-weight: 850;
  transition: transform 0.16s ease, background-color 0.16s ease, border-color 0.16s ease;
}

.dark .calculator-key {
  background: rgba(15, 23, 42, 0.44);
}

.calculator-key:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--theme-primary) 28%, var(--border-strong));
}

.calculator-key-primary {
  color: white;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-darker));
}

.calculator-key-danger {
  color: rgb(185, 28, 28);
  background: rgba(254, 226, 226, 0.72);
}

.dark .calculator-key-danger {
  color: rgb(252, 165, 165);
  background: rgba(127, 29, 29, 0.36);
}
</style>
