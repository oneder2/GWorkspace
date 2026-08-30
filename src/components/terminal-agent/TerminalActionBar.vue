<template>
  <div class="terminal-actions" role="group" :aria-label="copy.ui.actionsLabel">
    <button type="button" class="terminal-action" @click="$emit('select', 'capture')">
      <FileTextIcon class="terminal-action-icon" />
      <span>{{ copy.ui.actions.capture }}</span>
    </button>
    <button type="button" class="terminal-action" @click="$emit('select', 'analyze')">
      <BrainIcon class="terminal-action-icon" />
      <span>{{ copy.ui.actions.analyze }}</span>
    </button>
    <button type="button" class="terminal-action" @click="$emit('select', 'review')">
      <ListIcon class="terminal-action-icon" />
      <span>{{ copy.ui.actions.review }}</span>
    </button>
  </div>
</template>

<script setup>
import BrainIcon from '../icons/BrainIcon.vue'
import FileTextIcon from '../icons/FileTextIcon.vue'
import ListIcon from '../icons/ListIcon.vue'

defineProps({
  copy: {
    type: Object,
    required: true
  }
})

defineEmits(['select'])
</script>

<style scoped>
.terminal-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--border-base);
}

.terminal-action {
  display: inline-flex;
  min-width: 0;
  min-height: 2.35rem;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border: 1px solid color-mix(in srgb, var(--agent-signal) 14%, var(--border-strong));
  border-radius: 7px;
  background: color-mix(in srgb, var(--surface-elevated) 76%, transparent);
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 700;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.terminal-action:hover,
.terminal-action:focus-visible {
  border-color: color-mix(in srgb, var(--agent-signal) 34%, var(--border-strong));
  background: color-mix(in srgb, var(--agent-signal) 9%, var(--surface-elevated));
  color: var(--text-main);
}

.terminal-action-icon {
  width: 0.95rem;
  height: 0.95rem;
  flex-shrink: 0;
  color: var(--agent-signal-deep);
}
</style>
