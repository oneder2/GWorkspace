<template>
  <button
    type="button"
    class="terminal-launcher"
    :class="{ 'terminal-launcher-open': open }"
    :aria-label="open ? copy.ui.dismissLabel : copy.ui.openLabel"
    :title="open ? copy.ui.dismissLabel : copy.ui.openLabel"
    @click="$emit('toggle')"
  >
    <span class="terminal-launcher-core" aria-hidden="true">
      <span class="terminal-launcher-pulse"></span>
      <span class="terminal-launcher-orb"></span>
    </span>

    <span class="terminal-launcher-copy">
      <span class="terminal-launcher-label">{{ copy.launcher.label }}</span>
      <span class="terminal-launcher-meta">
        <span class="terminal-launcher-dot"></span>
        <span>{{ state }}</span>
      </span>
    </span>
  </button>
</template>

<script setup>
defineProps({
  copy: {
    type: Object,
    required: true
  },
  open: {
    type: Boolean,
    default: false
  },
  state: {
    type: String,
    required: true
  }
})

defineEmits(['toggle'])
</script>

<style scoped>
.terminal-launcher {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 90;
  display: inline-flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 13.5rem;
  padding: 0.85rem 1rem;
  border-radius: 24px;
  border: 1px solid color-mix(in srgb, var(--agent-signal) 18%, var(--border-base));
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--surface-elevated) 92%, transparent), color-mix(in srgb, var(--surface-overlay) 90%, transparent)),
    radial-gradient(circle at top left, color-mix(in srgb, var(--agent-signal) 18%, transparent), transparent 45%);
  box-shadow: var(--shadow-medium), 0 0 0 1px color-mix(in srgb, var(--agent-signal) 10%, transparent);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease, opacity 0.22s ease;
}

.terminal-launcher:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-strong), 0 0 0 1px color-mix(in srgb, var(--agent-signal) 22%, transparent);
  border-color: color-mix(in srgb, var(--agent-signal) 32%, var(--border-base));
}

.terminal-launcher-open {
  border-color: color-mix(in srgb, var(--agent-signal) 42%, var(--border-base));
  opacity: 0;
  pointer-events: none;
  transform: translateY(8px) scale(0.98);
}

.terminal-launcher-core {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 18px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface-elevated) 96%, transparent), color-mix(in srgb, var(--surface-panel) 92%, transparent));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  overflow: hidden;
}

.terminal-launcher-pulse {
  position: absolute;
  inset: 0.5rem;
  border-radius: 999px;
  background: radial-gradient(circle, color-mix(in srgb, var(--agent-signal) 55%, white 10%), transparent 68%);
  animation: terminalLauncherPulse 2.8s ease-in-out infinite;
}

.terminal-launcher-orb {
  position: relative;
  width: 0.95rem;
  height: 0.95rem;
  border-radius: 999px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--agent-signal) 86%, white 18%), color-mix(in srgb, var(--agent-signal-deep) 88%, transparent));
  box-shadow: 0 0 16px color-mix(in srgb, var(--agent-signal) 42%, transparent);
}

.terminal-launcher-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
}

.terminal-launcher-label {
  max-width: 100%;
  color: var(--text-main);
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.terminal-launcher-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.terminal-launcher-dot {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 999px;
  background: var(--agent-signal);
  box-shadow: 0 0 10px color-mix(in srgb, var(--agent-signal) 44%, transparent);
}

@keyframes terminalLauncherPulse {
  0%,
  100% {
    transform: scale(0.92);
    opacity: 0.55;
  }

  50% {
    transform: scale(1.08);
    opacity: 0.95;
  }
}

@media (max-width: 767px) {
  .terminal-launcher {
    right: 0.85rem;
    bottom: calc(0.85rem + env(safe-area-inset-bottom, 0px));
    min-width: 0;
    width: auto;
    max-width: calc(100vw - 1.7rem);
    padding: 0.8rem 0.9rem;
  }

  .terminal-launcher-label {
    font-size: 0.86rem;
  }
}
</style>
