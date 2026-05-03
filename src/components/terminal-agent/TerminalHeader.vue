<template>
  <div class="terminal-header divider-strong-b">
    <div class="terminal-header-copy">
      <span class="terminal-header-kicker">{{ copy.meta.badge }}</span>
      <div class="terminal-header-row">
        <h3 class="terminal-header-title">{{ copy.header.title }}</h3>
        <span class="terminal-header-status">
          <span class="terminal-header-dot"></span>
          <span>{{ state }}</span>
        </span>
      </div>
      <p class="terminal-header-subtitle">{{ copy.header.subtitle }}</p>
    </div>

    <button
      type="button"
      class="icon-btn terminal-header-close"
      :aria-label="copy.ui.dismissLabel"
      :title="copy.ui.dismissLabel"
      @click="$emit('close')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>
</template>

<script setup>
defineProps({
  copy: {
    type: Object,
    required: true
  },
  state: {
    type: String,
    required: true
  }
})

defineEmits(['close'])
</script>

<style scoped>
.terminal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1rem 0.95rem;
}

.terminal-header-copy {
  min-width: 0;
}

.terminal-header-kicker {
  display: inline-flex;
  color: var(--agent-signal-deep);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.terminal-header-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-top: 0.35rem;
}

.terminal-header-title {
  color: var(--text-main);
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.terminal-header-status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  padding: 0.24rem 0.55rem;
  background: color-mix(in srgb, var(--agent-signal) 12%, transparent);
  color: var(--agent-signal-deep);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.terminal-header-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 999px;
  background: var(--agent-signal);
}

.terminal-header-subtitle {
  margin-top: 0.45rem;
  color: var(--text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.terminal-header-close {
  flex-shrink: 0;
}
</style>
