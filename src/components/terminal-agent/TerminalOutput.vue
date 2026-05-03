<template>
  <div ref="scrollRef" class="terminal-output custom-scrollbar">
    <div v-if="entries.length === 0" class="terminal-empty surface-card">
      <p class="terminal-empty-kicker">{{ prompt }}</p>
      <h4 class="terminal-empty-title">{{ emptyState.title }}</h4>
      <p class="terminal-empty-body">{{ emptyState.body }}</p>
      <div class="terminal-empty-hints">
        <span v-for="hint in emptyState.hints" :key="hint" class="terminal-empty-hint">{{ hint }}</span>
      </div>
    </div>

    <div v-for="entry in entries" :key="entry.id" class="terminal-entry">
      <div v-if="entry.command" class="terminal-command-row">
        <span class="terminal-command-prompt">{{ prompt }}</span>
        <span class="terminal-command-value">{{ entry.command }}</span>
      </div>

      <div class="terminal-blocks">
        <template v-for="(block, index) in entry.blocks" :key="`${entry.id}-${index}`">
          <p v-if="block.type === 'text'" class="terminal-text" :class="resolveTextTone(block.tone)">
            {{ block.content }}
          </p>

          <div v-else-if="block.type === 'lines'" class="terminal-lines" :class="resolveTextTone(block.tone)">
            <p v-for="line in block.items" :key="line">{{ line }}</p>
          </div>

          <div v-else-if="block.type === 'status'" class="terminal-status-grid">
            <div v-for="item in block.items" :key="`${item.label}-${item.value}`" class="terminal-status-card">
              <span class="terminal-status-label">{{ item.label }}</span>
              <span class="terminal-status-value">{{ item.value }}</span>
            </div>
          </div>

          <div v-else-if="block.type === 'commands'" class="terminal-command-grid">
            <div v-for="item in block.items" :key="item.name" class="terminal-command-card">
              <span class="terminal-command-name">{{ item.name }}</span>
              <span class="terminal-command-description">{{ item.description }}</span>
            </div>
          </div>

          <div v-else-if="block.type === 'links'" class="terminal-link-grid">
            <component
              :is="item.to ? RouterLink : 'a'"
              v-for="item in block.items"
              :key="`${item.label}-${item.to || item.href}`"
              :to="item.to"
              :href="item.href"
              :target="item.href ? '_blank' : null"
              :rel="item.href ? 'noreferrer' : null"
              class="terminal-link-card"
              @click="emit('link-activate')"
            >
              <span class="terminal-link-label">{{ item.label }}</span>
              <span v-if="item.meta" class="terminal-link-meta">{{ item.meta }}</span>
            </component>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  emptyState: {
    type: Object,
    required: true
  },
  entries: {
    type: Array,
    required: true
  },
  prompt: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['link-activate'])

const scrollRef = ref(null)

function scrollToBottom() {
  nextTick(() => {
    if (!scrollRef.value) {
      return
    }

    scrollRef.value.scrollTop = scrollRef.value.scrollHeight
  })
}

function resolveTextTone(tone) {
  return {
    'terminal-text-muted': tone === 'muted',
    'terminal-text-error': tone === 'error',
    'terminal-text-boot': tone === 'boot'
  }
}

watch(
  () => props.entries.length,
  () => {
    scrollToBottom()
  },
  { immediate: true }
)
</script>

<style scoped>
.terminal-output {
  height: 100%;
  overflow-y: auto;
  padding: 0.2rem 0.2rem 0.4rem;
}

.terminal-empty {
  padding: 1rem;
  border-radius: 24px;
}

.terminal-empty-kicker {
  color: var(--agent-signal-deep);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.terminal-empty-title {
  margin-top: 0.45rem;
  color: var(--text-main);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.terminal-empty-body {
  margin-top: 0.4rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
}

.terminal-empty-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.9rem;
}

.terminal-empty-hint {
  display: inline-flex;
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
  background: color-mix(in srgb, var(--agent-signal) 10%, transparent);
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 700;
}

.terminal-entry + .terminal-entry {
  margin-top: 1.25rem;
}

.terminal-command-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.65rem;
}

.terminal-command-prompt {
  color: var(--agent-signal-deep);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.terminal-command-value {
  color: var(--text-main);
  font-size: 0.92rem;
  font-weight: 700;
}

.terminal-blocks {
  display: grid;
  gap: 0.8rem;
}

.terminal-text,
.terminal-lines {
  color: var(--text-secondary);
  font-size: 0.92rem;
  line-height: 1.65;
}

.terminal-lines {
  display: grid;
  gap: 0.3rem;
}

.terminal-text-muted {
  color: var(--text-muted);
}

.terminal-text-error {
  color: var(--accent-danger);
}

.terminal-text-boot {
  color: var(--agent-signal-deep);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.terminal-status-grid,
.terminal-command-grid,
.terminal-link-grid {
  display: grid;
  gap: 0.65rem;
}

.terminal-status-grid,
.terminal-command-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.terminal-status-card,
.terminal-command-card,
.terminal-link-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.25rem;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--agent-signal) 12%, var(--border-strong));
  background: color-mix(in srgb, var(--surface-elevated) 94%, transparent);
  padding: 0.85rem 0.9rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.68);
}

.terminal-status-label,
.terminal-link-meta,
.terminal-command-description {
  color: var(--text-muted);
  font-size: 0.74rem;
  line-height: 1.45;
}

.terminal-status-value,
.terminal-command-name,
.terminal-link-label {
  color: var(--text-main);
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.45;
}

.terminal-link-card {
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.terminal-link-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--agent-signal) 24%, var(--border-strong));
  box-shadow: var(--shadow-soft);
}

@media (max-width: 767px) {
  .terminal-status-grid,
  .terminal-command-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
