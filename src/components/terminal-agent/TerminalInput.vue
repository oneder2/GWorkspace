<template>
  <div class="terminal-input-shell">
    <span class="terminal-input-prompt">{{ prompt }}</span>
    <input
      ref="inputRef"
      :value="modelValue"
      :placeholder="placeholder"
      class="terminal-input"
      type="text"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      @input="$emit('update:modelValue', $event.target.value)"
      @keydown.enter.prevent="$emit('submit')"
      @keydown.up.prevent="$emit('navigate-history', 'up')"
      @keydown.down.prevent="$emit('navigate-history', 'down')"
    >
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    required: true
  }
})

defineEmits(['navigate-history', 'submit', 'update:modelValue'])

const inputRef = ref(null)

function focusInput() {
  inputRef.value?.focus()
}

defineExpose({
  focusInput
})
</script>

<style scoped>
.terminal-input-shell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 22px;
  border: 1px solid color-mix(in srgb, var(--agent-signal) 16%, var(--border-strong));
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface-elevated) 94%, transparent), color-mix(in srgb, var(--surface-panel) 90%, transparent));
  padding: 0.85rem 0.95rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76);
}

.terminal-input-prompt {
  flex-shrink: 0;
  color: var(--agent-signal-deep);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.terminal-input {
  width: 100%;
  min-width: 0;
  background: transparent;
  color: var(--text-main);
  font-size: 0.95rem;
  outline: none;
}

.terminal-input::placeholder {
  color: var(--text-muted);
}

@media (max-width: 767px) {
  .terminal-input-shell {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
}
</style>
