<!--
  颜色选择器工具
  提供站内调色、格式转换和预设色板
-->
<template>
  <div class="color-tool-shell w-full">
    <div class="color-tool-card color-workbench">
      <section class="color-picker-panel" :aria-label="$t('tools.colorWorkspace.pickerLabel')">
        <div class="color-topbar">
          <div class="color-preview-chip" :style="{ backgroundColor: color }"></div>
          <div class="color-current-block">
            <span>{{ $t('tools.colorWorkspace.current') }}</span>
            <input
              :value="colorDraft"
              @input="updateColorDraft"
              @blur="commitColorDraft"
              @keydown.enter="commitColorDraft"
              type="text"
              class="color-hex-input"
              :placeholder="$t('tools.colorWorkspace.placeholder')"
            >
          </div>
        </div>

        <div class="color-stage">
          <div
            ref="svPad"
            class="color-sv-pad"
            :style="svPadStyle"
            @pointerdown="startSvDrag"
          >
            <span
              class="color-sv-thumb"
              :style="{ left: `${activeHsv.s}%`, top: `${100 - activeHsv.v}%` }"
            ></span>
          </div>

          <input
            :value="activeHsv.h"
            @input="updateHue"
            type="range"
            min="0"
            max="359"
            step="1"
            class="color-hue-slider"
            :aria-label="$t('tools.colorWorkspace.hue')"
          >

          <div class="color-channel-grid">
            <label>
              <span>H</span>
              <input :value="activeHsv.h" @input="updateHsvChannel('h', $event)" type="number" min="0" max="359">
            </label>
            <label>
              <span>S</span>
              <input :value="activeHsv.s" @input="updateHsvChannel('s', $event)" type="number" min="0" max="100">
            </label>
            <label>
              <span>V</span>
              <input :value="activeHsv.v" @input="updateHsvChannel('v', $event)" type="number" min="0" max="100">
            </label>
          </div>
        </div>
      </section>

      <section class="color-data-panel" :aria-label="$t('tools.colorWorkspace.valuesLabel')">
        <div class="color-hero-card">
          <div class="color-hero-preview" :style="{ backgroundColor: color }">
            <span>{{ color }}</span>
          </div>
          <div class="color-hero-meta">
            <span class="color-hero-label">{{ $t('tools.colorWorkspace.activeTone') }}</span>
            <strong>{{ rgbColor }}</strong>
            <p>{{ $t('tools.colorWorkspace.activeToneDesc') }}</p>
          </div>
        </div>

        <div class="color-format-grid">
          <label class="color-format-card">
            <span>HEX</span>
            <input
              :value="hexColor"
              @input="updateFromHex"
              type="text"
            >
          </label>
          <label class="color-format-card">
            <span>RGB</span>
            <input
              :value="rgbColor"
              @input="updateFromRGB"
              type="text"
            >
          </label>
          <label class="color-format-card">
            <span>HSL</span>
            <input
              :value="hslColor"
              @input="updateFromHSL"
              type="text"
            >
          </label>
          <label class="color-format-card">
            <span>HSV</span>
            <input
              :value="hsvColor"
              @input="updateFromHSV"
              type="text"
            >
          </label>
        </div>

        <div class="color-palette-card">
          <div class="color-palette-head">
            <span>{{ $t('tools.colorWorkspace.quickPalette') }}</span>
            <span>{{ $t('tools.colorWorkspace.paletteCount', { count: palette.length }) }}</span>
          </div>
          <div class="color-palette-strip">
            <button
              v-for="paletteColor in palette"
              :key="paletteColor"
              type="button"
              @click="setColor(paletteColor)"
              :class="{ 'is-active': color === paletteColor }"
              :style="{ backgroundColor: paletteColor }"
            ></button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

useI18n()

const svPad = ref(null)

const normalizeHex = (value) => {
  const nextValue = String(value || '').trim()
  const shortMatch = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(nextValue)
  if (shortMatch) {
    return `#${shortMatch[1]}${shortMatch[1]}${shortMatch[2]}${shortMatch[2]}${shortMatch[3]}${shortMatch[3]}`.toLowerCase()
  }

  const fullMatch = /^#?([a-f\d]{6})$/i.exec(nextValue)
  return fullMatch ? `#${fullMatch[1]}`.toLowerCase() : ''
}

const clamp = (value, min, max) => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return min
  return Math.min(max, Math.max(min, Math.round(numericValue)))
}

const normalizeHue = (value) => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return 0
  return ((numericValue % 360) + 360) % 360
}

const hexToRgb = (hex) => {
  const normalizedHex = normalizeHex(hex)
  const result = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalizedHex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

const isRgbColor = (rgb) => (
  rgb &&
  Number.isFinite(rgb.r) &&
  Number.isFinite(rgb.g) &&
  Number.isFinite(rgb.b)
)

const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(value => {
    const hex = clamp(value, 0, 255).toString(16)
    return hex.length === 1 ? `0${hex}` : hex
  }).join('')
}

const rgbToHsl = ({ r, g, b }) => {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2
  const delta = max - min

  if (delta === 0) {
    return { h: 0, s: 0, l: Math.round(lightness * 100) }
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1))
  let hue = 0

  if (max === red) {
    hue = ((green - blue) / delta) % 6
  } else if (max === green) {
    hue = (blue - red) / delta + 2
  } else {
    hue = (red - green) / delta + 4
  }

  return {
    h: Math.round((hue * 60 + 360) % 360),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100)
  }
}

const hslToRgb = (h, s, l) => {
  const hue = normalizeHue(h)
  const saturation = clamp(s, 0, 100) / 100
  const lightness = clamp(l, 0, 100) / 100
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1))
  const match = lightness - chroma / 2
  let red = 0
  let green = 0
  let blue = 0

  if (hue < 60) {
    red = chroma
    green = x
  } else if (hue < 120) {
    red = x
    green = chroma
  } else if (hue < 180) {
    green = chroma
    blue = x
  } else if (hue < 240) {
    green = x
    blue = chroma
  } else if (hue < 300) {
    red = x
    blue = chroma
  } else {
    red = chroma
    blue = x
  }

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255)
  }
}

const rgbToHsv = ({ r, g, b }) => {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  let hue = 0

  if (delta !== 0) {
    if (max === red) {
      hue = ((green - blue) / delta) % 6
    } else if (max === green) {
      hue = (blue - red) / delta + 2
    } else {
      hue = (red - green) / delta + 4
    }
  }

  return {
    h: Math.round((hue * 60 + 360) % 360),
    s: max === 0 ? 0 : Math.round((delta / max) * 100),
    v: Math.round(max * 100)
  }
}

const hsvToRgb = (h, s, v) => {
  const hue = normalizeHue(h)
  const saturation = clamp(s, 0, 100) / 100
  const value = clamp(v, 0, 100) / 100
  const chroma = value * saturation
  const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1))
  const match = value - chroma
  let red = 0
  let green = 0
  let blue = 0

  if (hue < 60) {
    red = chroma
    green = x
  } else if (hue < 120) {
    red = x
    green = chroma
  } else if (hue < 180) {
    green = chroma
    blue = x
  } else if (hue < 240) {
    green = x
    blue = chroma
  } else if (hue < 300) {
    red = x
    blue = chroma
  } else {
    red = chroma
    blue = x
  }

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255)
  }
}

const createColorStateFromHex = (hex, fallbackHsv = { h: 0, s: 0, v: 0 }) => {
  const normalizedHex = normalizeHex(hex)
  const rgb = hexToRgb(normalizedHex)

  if (!normalizedHex || !isRgbColor(rgb)) {
    return null
  }

  const hsl = rgbToHsl(rgb)
  const hsv = rgbToHsv(rgb)

  return {
    hex: normalizedHex,
    rgb,
    hsl,
    hsv: {
      h: hsv.s === 0 ? fallbackHsv.h : hsv.h,
      s: hsv.s,
      v: hsv.v
    }
  }
}

const createColorStateFromHsv = (hsv) => {
  const safeHsv = {
    h: normalizeHue(hsv.h),
    s: clamp(hsv.s, 0, 100),
    v: clamp(hsv.v, 0, 100)
  }
  const rgb = hsvToRgb(safeHsv.h, safeHsv.s, safeHsv.v)
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
  const hsl = rgbToHsl(rgb)

  return {
    hex,
    rgb,
    hsl,
    hsv: safeHsv
  }
}

const colorState = ref(createColorStateFromHex('#22c55e'))
const colorDraft = ref(colorState.value.hex)
const color = computed(() => colorState.value.hex)
const activeHsv = computed(() => colorState.value.hsv)

const applyColorState = (nextState) => {
  if (!nextState) return
  colorState.value = nextState
  colorDraft.value = nextState.hex
}

const applyColorFromHex = (value) => {
  applyColorState(createColorStateFromHex(value, activeHsv.value))
}

const applyColorFromHsv = (partialHsv) => {
  applyColorState(createColorStateFromHsv({
    ...activeHsv.value,
    ...partialHsv
  }))
}

const setColor = (value) => {
  applyColorFromHex(value)
}

const svPadStyle = computed(() => ({
  backgroundColor: `hsl(${activeHsv.value.h}, 100%, 50%)`
}))

const updateFromHsvParts = ({ h = activeHsv.value.h, s = activeHsv.value.s, v = activeHsv.value.v }) => {
  applyColorFromHsv({ h, s, v })
}

const updateHue = (e) => {
  updateFromHsvParts({ h: Number(e.target.value) })
}

const updateHsvChannel = (channel, event) => {
  updateFromHsvParts({ [channel]: Number(event.target.value) })
}

const updateSvFromPointer = (event) => {
  const rect = svPad.value?.getBoundingClientRect()
  if (!rect) return

  const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100)
  const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100)
  updateFromHsvParts({ s: x, v: 100 - y })
}

const stopSvDrag = () => {
  window.removeEventListener('pointermove', updateSvFromPointer)
  window.removeEventListener('pointerup', stopSvDrag)
}

const startSvDrag = (event) => {
  event.preventDefault()
  updateSvFromPointer(event)
  window.addEventListener('pointermove', updateSvFromPointer)
  window.addEventListener('pointerup', stopSvDrag, { once: true })
}

onBeforeUnmount(() => {
  stopSvDrag()
})

const hexColor = computed(() => color.value)

const rgbColor = computed(() => {
  const { rgb } = colorState.value
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
})

const hslColor = computed(() => {
  const { hsl } = colorState.value
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
})

const hsvColor = computed(() => {
  const hsv = activeHsv.value
  return `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`
})

const updateFromHex = (e) => {
  applyColorFromHex(e.target.value)
}

const updateColorDraft = (e) => {
  colorDraft.value = e.target.value
  const value = normalizeHex(e.target.value)
  if (value) {
    applyColorFromHex(value)
  }
}

const commitColorDraft = () => {
  const value = normalizeHex(colorDraft.value)
  colorDraft.value = value || color.value
  if (value) {
    applyColorFromHex(value)
  }
}

const updateFromRGB = (e) => {
  const match = e.target.value.match(/^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:[\s,/]+[\d.]+)?\s*\)$/i)
  if (match) {
    setColor(rgbToHex(match[1], match[2], match[3]))
  }
}

const updateFromHSL = (e) => {
  const match = e.target.value.match(/^hsl\(\s*(-?\d+(?:\.\d+)?)\s*,?\s+(\d{1,3})%\s*,?\s+(\d{1,3})%\s*\)$/i)
  if (match) {
    const rgb = hslToRgb(match[1], match[2], match[3])
    if (isRgbColor(rgb)) {
      applyColorFromHex(rgbToHex(rgb.r, rgb.g, rgb.b))
    }
  }
}

const updateFromHSV = (e) => {
  const match = e.target.value.match(/^hsv\(\s*(-?\d+(?:\.\d+)?)\s*,?\s+(\d{1,3})%\s*,?\s+(\d{1,3})%\s*\)$/i)
  if (match) {
    applyColorFromHsv({ h: match[1], s: match[2], v: match[3] })
  }
}

const palette = [
  '#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899',
  '#10b981', '#2563eb', '#9333ea', '#ea580c', '#db2777',
  '#059669', '#1d4ed8', '#7e22ce', '#c2410c', '#be185d',
  '#047857', '#1e40af', '#6b21a8', '#9a3412', '#9f1239',
  '#065f46', '#1e3a8a', '#581c87', '#7c2d12', '#831843'
]
</script>

<style scoped>
.color-tool-shell {
  display: grid;
  gap: 0;
  max-height: 100%;
  container-type: inline-size;
}

.color-tool-card {
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--theme-primary) 12%, transparent), transparent 30%),
    var(--bg-card);
  border: 1px solid var(--border-base);
  border-radius: 1.2rem;
  box-shadow: 0 16px 32px rgb(15 23 42 / 0.08);
}

.dark .color-tool-card {
  box-shadow: 0 16px 32px rgb(2 6 23 / 0.28);
}

.color-workbench {
  display: grid;
  grid-template-columns: minmax(14rem, 18rem) minmax(0, 1fr);
  gap: clamp(0.75rem, 1.4cqi, 1.1rem);
  align-items: start;
  padding: clamp(0.72rem, 1.5cqi, 1rem);
  overflow: hidden;
}

.color-picker-panel,
.color-palette-card,
.color-format-card,
.color-hero-card {
  border: 1px solid rgb(255 255 255 / 0.34);
  background: rgb(255 255 255 / 0.34);
}

.dark .color-picker-panel,
.dark .color-palette-card,
.dark .color-format-card,
.dark .color-hero-card {
  background: rgb(15 23 42 / 0.26);
  border-color: rgb(255 255 255 / 0.08);
}

.color-picker-panel {
  display: grid;
  gap: clamp(0.55rem, 1cqi, 0.8rem);
  padding: clamp(0.7rem, 1.4cqi, 0.98rem);
  border-radius: 1rem;
}

.color-topbar {
  display: grid;
  grid-template-columns: clamp(2.8rem, 5cqi, 3.6rem) minmax(0, 1fr);
  gap: clamp(0.55rem, 0.9cqi, 0.78rem);
  align-items: center;
}

.color-preview-chip {
  width: clamp(2.8rem, 5cqi, 3.6rem);
  height: clamp(2.8rem, 5cqi, 3.6rem);
  border: 1px solid var(--border-base);
  border-radius: clamp(0.9rem, 1.4cqi, 1.1rem);
  box-shadow: 0 10px 20px rgb(15 23 42 / 0.08);
}

.color-current-block {
  display: grid;
  gap: clamp(0.2rem, 0.45cqi, 0.3rem);
}

.color-current-block span,
.color-hero-label,
.color-palette-head,
.color-format-card span {
  color: rgb(100 116 139);
  font-size: clamp(0.68rem, 0.9cqi, 0.82rem);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.color-hex-input {
  width: 100%;
  height: clamp(2.75rem, 4.4cqi, 3.3rem);
  padding: 0 clamp(0.85rem, 1.2cqi, 1rem);
  border: 1px solid var(--border-base);
  border-radius: clamp(0.85rem, 1.2cqi, 1rem);
  background: rgb(255 255 255 / 0.58);
  color: rgb(30 41 59);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: clamp(0.94rem, 1.3cqi, 1.08rem);
  font-weight: 700;
  text-transform: uppercase;
}

.dark .color-hex-input {
  background: rgb(15 23 42 / 0.52);
  color: rgb(226 232 240);
}

.color-stage {
  display: grid;
  gap: clamp(0.55rem, 0.95cqi, 0.75rem);
}

.color-sv-pad {
  position: relative;
  aspect-ratio: 1;
  width: 100%;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--theme-primary) 26%, rgb(255 255 255 / 28%));
  border-radius: 0.95rem;
  cursor: crosshair;
  touch-action: none;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.18), 0 14px 28px rgb(15 23 42 / 0.12);
}

.color-sv-pad::before,
.color-sv-pad::after {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
}

.color-sv-pad::before {
  background: linear-gradient(90deg, #fff, rgb(255 255 255 / 0));
}

.color-sv-pad::after {
  background: linear-gradient(0deg, #000, rgb(0 0 0 / 0));
}

.color-sv-thumb {
  position: absolute;
  width: 1rem;
  height: 1rem;
  border: 2px solid #fff;
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgb(15 23 42 / 0.55), 0 4px 12px rgb(15 23 42 / 0.35);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.color-hue-slider {
  width: 100%;
  height: clamp(0.62rem, 0.9cqi, 0.8rem);
  border-radius: 999px;
  appearance: none;
  cursor: pointer;
  background: linear-gradient(
    90deg,
    #f00 0%,
    #ff0 16.66%,
    #0f0 33.33%,
    #0ff 50%,
    #00f 66.66%,
    #f0f 83.33%,
    #f00 100%
  );
}

.color-hue-slider::-webkit-slider-thumb {
  width: 1rem;
  height: 1rem;
  border: 2px solid #fff;
  border-radius: 999px;
  appearance: none;
  background: var(--theme-primary);
  box-shadow: 0 0 0 1px rgb(15 23 42 / 0.35), 0 4px 10px rgb(15 23 42 / 0.25);
}

.color-hue-slider::-moz-range-thumb {
  width: 1rem;
  height: 1rem;
  border: 2px solid #fff;
  border-radius: 999px;
  background: var(--theme-primary);
  box-shadow: 0 0 0 1px rgb(15 23 42 / 0.35), 0 4px 10px rgb(15 23 42 / 0.25);
}

.color-channel-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(0.36rem, 0.7cqi, 0.52rem);
}

.color-channel-grid label {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(0.28rem, 0.45cqi, 0.36rem);
  padding: clamp(0.4rem, 0.75cqi, 0.56rem) clamp(0.5rem, 0.85cqi, 0.68rem);
  border: 1px solid var(--border-base);
  border-radius: clamp(0.78rem, 1cqi, 0.95rem);
  background: rgb(255 255 255 / 0.42);
}

.dark .color-channel-grid label {
  background: rgb(15 23 42 / 0.35);
}

.color-channel-grid span {
  color: rgb(100 116 139);
  font-size: clamp(0.68rem, 0.85cqi, 0.8rem);
  font-weight: 800;
}

.color-channel-grid input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgb(30 41 59);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: clamp(0.8rem, 1cqi, 0.94rem);
  font-weight: 700;
  text-align: right;
}

.dark .color-channel-grid input {
  color: rgb(226 232 240);
}

.color-data-panel {
  display: grid;
  gap: clamp(0.62rem, 1cqi, 0.88rem);
  min-width: 0;
}

.color-hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(11rem, 0.9fr);
  gap: clamp(0.7rem, 1.1cqi, 1rem);
  align-items: stretch;
  padding: clamp(0.68rem, 1.1cqi, 0.95rem);
  border-radius: 1rem;
}

.color-hero-preview {
  min-height: clamp(4.9rem, 10cqi, 8rem);
  padding: clamp(0.7rem, 1.1cqi, 0.95rem);
  border-radius: 0.95rem;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.18), 0 14px 28px rgb(15 23 42 / 0.1);
}

.color-hero-preview span {
  padding: clamp(0.28rem, 0.5cqi, 0.4rem) clamp(0.45rem, 0.9cqi, 0.62rem);
  border-radius: clamp(0.55rem, 0.9cqi, 0.7rem);
  background: rgb(15 23 42 / 0.42);
  color: #fff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: clamp(0.8rem, 1cqi, 0.96rem);
  font-weight: 800;
  text-transform: uppercase;
}

.color-hero-meta {
  display: grid;
  align-content: center;
  gap: clamp(0.24rem, 0.5cqi, 0.36rem);
}

.color-hero-meta strong {
  color: rgb(15 23 42);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: clamp(0.92rem, 1.35cqi, 1.18rem);
  font-weight: 800;
}

.dark .color-hero-meta strong {
  color: rgb(241 245 249);
}

.color-hero-meta p {
  margin: 0;
  color: rgb(71 85 105);
  font-size: clamp(0.74rem, 0.95cqi, 0.88rem);
  line-height: 1.4;
}

.dark .color-hero-meta p {
  color: rgb(148 163 184);
}

.color-format-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(0.5rem, 0.9cqi, 0.72rem);
}

.color-format-card {
  display: grid;
  gap: clamp(0.3rem, 0.55cqi, 0.42rem);
  min-width: 0;
  padding: clamp(0.62rem, 0.95cqi, 0.84rem) clamp(0.7rem, 1cqi, 0.92rem);
  border-radius: 0.95rem;
}

.color-format-grid input {
  width: 100%;
  min-width: 0;
  height: clamp(2.1rem, 3.2cqi, 2.65rem);
  padding: 0 clamp(0.62rem, 0.9cqi, 0.8rem);
  border: 1px solid var(--border-base);
  border-radius: 0.72rem;
  background: rgb(255 255 255 / 0.55);
  color: rgb(30 41 59);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: clamp(0.76rem, 0.95cqi, 0.9rem);
}

.dark .color-format-grid input {
  background: rgb(15 23 42 / 0.45);
  color: rgb(226 232 240);
}

.color-palette-card {
  display: grid;
  gap: clamp(0.55rem, 0.9cqi, 0.75rem);
  padding: clamp(0.68rem, 1cqi, 0.9rem);
  border-radius: 1rem;
}

.color-palette-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.color-palette-strip {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(0.34rem, 0.55cqi, 0.5rem);
}

.color-palette-strip button {
  width: clamp(1.65rem, 2.2cqi, 2.1rem);
  height: clamp(1.65rem, 2.2cqi, 2.1rem);
  border: 1px solid rgb(255 255 255 / 0.22);
  border-radius: clamp(0.58rem, 0.8cqi, 0.72rem);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.16);
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.color-palette-strip button.is-active {
  border-color: #fff;
  box-shadow: 0 0 0 2px var(--theme-primary), inset 0 1px 0 rgb(255 255 255 / 0.18);
}

@container (max-width: 860px) {
  .color-workbench {
    grid-template-columns: 1fr;
  }

  .color-hero-card {
    grid-template-columns: 1fr;
  }
}

@container (max-width: 560px) {
  .color-workbench {
    padding: 0.58rem;
  }

  .color-picker-panel,
  .color-palette-card,
  .color-format-card,
  .color-hero-card {
    padding-left: 0.58rem;
    padding-right: 0.58rem;
  }

  .color-format-grid {
    grid-template-columns: 1fr;
  }
}
</style>
