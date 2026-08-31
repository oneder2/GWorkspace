<template>
  <fieldset class="surface-picker">
    <legend v-if="label">{{ label }}</legend>
    <label
      v-for="surface in surfaces"
      :key="surface.id"
      class="surface-option"
      :style="{ '--surface-color': surface.color }"
    >
      <input
        type="checkbox"
        :checked="modelValue.includes(surface.id)"
        @change="toggle(surface.id, $event.target.checked)"
      />
      <span class="surface-mark" />
      <span>{{ surface.label }}</span>
    </label>
  </fieldset>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])
const surfaces = [
  { id: 'portfolio', label: 'Portfolio', color: '#0f766e' },
  { id: 'resume_web', label: 'Resume web', color: '#2563eb' },
  { id: 'resume_pdf', label: 'Resume PDF', color: '#7c3aed' },
  { id: 'gellaria', label: 'Gellaria', color: '#d97706' }
]

function toggle(id, checked) {
  const next = checked
    ? [...new Set([...props.modelValue, id])]
    : props.modelValue.filter(surface => surface !== id)
  emit('update:modelValue', next)
}
</script>

<style scoped>
.surface-picker { display: flex; flex-wrap: wrap; gap: .5rem 1rem; margin: 0; padding: 0; border: 0; }
.surface-picker legend { width: 100%; margin-bottom: .15rem; color: var(--text-secondary); font-size: .72rem; }
.surface-option { display: inline-flex; align-items: center; gap: .42rem; color: var(--text-secondary); font-size: .72rem; cursor: pointer; }
.surface-option input { position: absolute; opacity: 0; pointer-events: none; }
.surface-mark { width: 8px; height: 18px; border: 1px solid color-mix(in srgb, var(--surface-color) 45%, var(--border-strong)); background: transparent; }
.surface-option input:checked + .surface-mark { background: var(--surface-color); border-color: var(--surface-color); }
.surface-option:focus-within .surface-mark { outline: 2px solid var(--theme-primary); outline-offset: 2px; }
</style>
