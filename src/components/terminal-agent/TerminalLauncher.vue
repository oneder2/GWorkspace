<template>
  <button
    type="button"
    class="terminal-launcher"
    :class="{ 'terminal-launcher-open': open }"
    :aria-label="open ? copy.ui.dismissLabel : copy.ui.openLabel"
    :title="open ? copy.ui.dismissLabel : copy.ui.openLabel"
    @click="$emit('toggle')"
  >
    <span class="terminal-launcher-icon-shell" aria-hidden="true">
      <span class="terminal-launcher-icon-glow"></span>
      <span class="terminal-launcher-icon"></span>
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
  right: 1.4rem;
  bottom: calc(1.45rem + env(safe-area-inset-bottom, 0px));
  z-index: 90;
  display: inline-flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 13rem;
  padding: 0.82rem 0.95rem;
  border-radius: 26px;
  border: 1px solid color-mix(in srgb, var(--agent-signal) 18%, var(--border-base));
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--surface-elevated) 94%, transparent), color-mix(in srgb, var(--surface-overlay) 90%, transparent)),
    radial-gradient(circle at top left, color-mix(in srgb, var(--agent-signal) 16%, transparent), transparent 46%);
  box-shadow:
    0 18px 42px rgba(15, 23, 42, 0.16),
    0 0 0 1px color-mix(in srgb, var(--agent-signal) 8%, transparent);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  transition: transform 0.26s ease, box-shadow 0.26s ease, border-color 0.26s ease, opacity 0.22s ease;
}

.terminal-launcher::before {
  content: "";
  position: absolute;
  inset: auto 0.85rem -0.7rem 0.85rem;
  height: 1.15rem;
  border-radius: 999px;
  background: radial-gradient(circle, color-mix(in srgb, var(--agent-signal) 24%, transparent), transparent 72%);
  filter: blur(12px);
  opacity: 0.65;
  pointer-events: none;
}

.terminal-launcher:hover {
  transform: translateY(-3px) scale(1.01);
  border-color: color-mix(in srgb, var(--agent-signal) 30%, var(--border-base));
  box-shadow:
    0 24px 54px rgba(15, 23, 42, 0.2),
    0 0 0 1px color-mix(in srgb, var(--agent-signal) 18%, transparent);
}

.terminal-launcher-open {
  opacity: 0;
  pointer-events: none;
  transform: translateY(8px) scale(0.98);
}

.terminal-launcher-icon-shell {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--agent-signal) 18%, var(--border-base));
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface-elevated) 98%, transparent), color-mix(in srgb, var(--surface-panel) 90%, transparent));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.66), 0 10px 24px color-mix(in srgb, var(--agent-signal) 10%, transparent);
  overflow: hidden;
}

.terminal-launcher-icon-glow {
  position: absolute;
  inset: -20%;
  background: radial-gradient(circle at 28% 24%, color-mix(in srgb, var(--agent-signal) 25%, transparent), transparent 58%);
  opacity: 0.95;
}

.terminal-launcher-icon {
  position: relative;
  width: 1.5rem;
  height: 1.5rem;
  background-color: var(--theme-primary-darker);
  -webkit-mask: url('/images/icons/terminal.svg') center / contain no-repeat;
  mask: url('/images/icons/terminal.svg') center / contain no-repeat;
  filter: drop-shadow(0 0 12px color-mix(in srgb, var(--agent-signal) 24%, transparent));
  transition: transform 0.26s ease, background-color 0.26s ease, filter 0.26s ease;
}

.terminal-launcher:hover .terminal-launcher-icon {
  transform: translateY(-1px) scale(1.03);
  background-color: var(--agent-signal-deep);
  filter: drop-shadow(0 0 14px color-mix(in srgb, var(--agent-signal) 36%, transparent));
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
  font-size: 0.9rem;
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
  font-size: 0.7rem;
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

@media (max-width: 767px) {
  .terminal-launcher {
    right: 1rem;
    bottom: calc(1.15rem + env(safe-area-inset-bottom, 0px));
    min-width: 0;
    width: auto;
    max-width: calc(100vw - 2rem);
    padding: 0.78rem 0.88rem;
  }

  .terminal-launcher-icon-shell {
    width: 2.7rem;
    height: 2.7rem;
  }

  .terminal-launcher-label {
    font-size: 0.84rem;
  }
}
</style>
