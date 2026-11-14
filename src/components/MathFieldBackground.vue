<template>
  <svg ref="host" class="math-field" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g class="field-lines" fill="none" stroke="currentColor" stroke-width=".8">
      <path v-for="(line, index) in lines" :key="index" :d="line" />
    </g>
    <g fill="currentColor" opacity=".5">
      <circle v-for="n in 12" :key="n" :cx="n * 65" :cy="200 + 90 * Math.sin(n * .7)" r="1.5" />
    </g>
  </svg>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
const props = defineProps({ mode: { type: Number, default: 0 } })
const pointer = ref({ x: 0, y: 0 })
const host = ref(null)
let element, frame = 0, pending = null, reduced
// Streamlines integrate a divergence-free field derived from a sinusoidal potential.
const lines = computed(() => Array.from({ length: 24 }, (_, i) => {
  const points = []
  let x = -4 + (i % 8) * 1.15, y = -2 + Math.floor(i / 8) * 2
  for (let j = 0; j < 65; j++) {
    if (props.mode === 1) {
      const t = j / 64 * Math.PI * 2
      x = (2.4 + i * .027) * Math.sin(3 * t + pointer.value.x * .6 + i * .065)
      y = (1.25 + i * .018) * Math.sin(2 * t + pointer.value.y * .6)
    } else {
      const dx = x - pointer.value.x, dy = y - pointer.value.y
      const radius = 1 + dx * dx + dy * dy
      x += .065 * (Math.sin(x) * Math.cos(y) - dy / radius)
      y += .065 * (-Math.cos(x) * Math.sin(y) + dx / radius)
    }
    points.push(`${j ? 'L' : 'M'}${(400 + x * 95).toFixed(1)},${(200 + y * 95).toFixed(1)}`)
  }
  return points.join(' ')
}))
function move(event) {
  if (reduced?.matches) return
  const rect = element.getBoundingClientRect()
  pending = { x: (event.clientX - rect.left) / rect.width * 6 - 3, y: (event.clientY - rect.top) / rect.height * 4 - 2 }
  if (!frame) frame = requestAnimationFrame(() => { pointer.value = pending; frame = 0 })
}
onMounted(() => {
  element = host.value?.parentElement
  if (!element) return
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  element.addEventListener('pointermove', move, { passive: true })
  element.addEventListener('pointerdown', move, { passive: true })
})
onUnmounted(() => {
  cancelAnimationFrame(frame)
  element?.removeEventListener('pointermove', move)
  element?.removeEventListener('pointerdown', move)
})
</script>

<style scoped>
.math-field { position: absolute; inset: 0; width: 100%; height: 100%; color: var(--theme-primary); opacity: .24; pointer-events: none; mask-image: linear-gradient(110deg, transparent, #000 65%); }
</style>
