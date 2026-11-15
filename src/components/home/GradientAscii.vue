<template>
  <div ref="container" class="ascii-scene" :data-ready="ready">
    <img v-show="!ready" :src="fallback" alt="" class="ascii-fallback" />
    <canvas ref="canvas" aria-hidden="true" @webglcontextlost.prevent="ready = false" @webglcontextrestored="start" />
    <button v-if="ready" type="button" class="ascii-pause" :aria-pressed="paused" @click="paused = !paused">{{ $t(paused ? 'homeV2.play' : 'homeV2.pause') }}</button>
    <span class="ascii-hint">{{ $t('homeV2.touch') }}</span>
  </div>
</template>
<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { createGradientASCII } from './gradientAsciiRenderer'
const container = ref(null), canvas = ref(null), ready = ref(false), paused = ref(false)
const fallback = `${import.meta.env.BASE_URL}images/home/ascii-poster.webp`
let cleanup, themeObserver, media
function start() {
  cleanup?.()
  ready.value = false
  try {
    cleanup = createGradientASCII(container.value, canvas.value, { dark: document.documentElement.classList.contains('dark'), paused: paused.value || media?.matches, onReady: () => { ready.value = true } })
  } catch { ready.value = false }
}
watch(paused, start)
onMounted(() => {
  media = matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', start)
  themeObserver = new MutationObserver(start)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  start()
})
onUnmounted(() => { cleanup?.(); themeObserver?.disconnect(); media?.removeEventListener('change', start) })
</script>
<style scoped>
.ascii-scene { position: relative; min-width: 0; height: 100%; min-height: 300px; overflow: hidden; background: #c6d4c5; }
.dark .ascii-scene { background: #1c3432; }
.ascii-scene canvas, .ascii-fallback { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.ascii-pause { position: absolute; z-index: 1; right: 18px; top: 18px; padding: 9px 14px; border-radius: 4px; color: var(--text-main); background: var(--surface-elevated); font-size: 13px; }
.ascii-hint { position: absolute; bottom: 20px; left: 24px; color: #23433b; font-size: 13px; pointer-events: none; }
.dark .ascii-hint { color: #d8e6d3; }
@media (max-width: 600px) { .ascii-scene { min-height: 240px; } }
</style>
