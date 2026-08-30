<template>
  <div ref="scrollRef" class="terminal-output custom-scrollbar">
    <div v-if="entries.length === 0" class="terminal-empty">
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

          <h5 v-else-if="block.type === 'section-title'" class="terminal-section-title">
            {{ block.content }}
          </h5>

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

          <div v-else-if="block.type === 'analysis'" class="terminal-analysis">
            <div v-for="item in block.items" :key="item.key" class="terminal-analysis-row">
              <span class="terminal-analysis-label">{{ item.label }}</span>
              <p class="terminal-analysis-copy">{{ item.content }}</p>
            </div>
          </div>

          <div v-else-if="block.type === 'timeline'" class="terminal-timeline">
            <span class="terminal-timeline-heading">{{ block.label }}</span>
            <div class="terminal-timeline-list">
              <div v-for="item in block.items" :key="`${item.label}-${item.meta}`" class="terminal-timeline-item">
                <span class="terminal-timeline-mark" :class="`is-${item.tone || 'activity'}`"></span>
                <div class="terminal-timeline-copy">
                  <span class="terminal-timeline-label">{{ item.label }}</span>
                  <span v-if="item.meta" class="terminal-timeline-meta">{{ item.meta }}</span>
                </div>
              </div>
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
    'terminal-text-success': tone === 'success',
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
  border-left: 2px solid color-mix(in srgb, var(--agent-signal) 44%, var(--border-strong));
  background: color-mix(in srgb, var(--surface-elevated) 54%, transparent);
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
  letter-spacing: 0;
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
  border-radius: 4px;
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

.terminal-text-success {
  color: var(--accent-success, var(--agent-signal-deep));
  font-size: 0.78rem;
  font-weight: 700;
}

.terminal-text-boot {
  color: var(--agent-signal-deep);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.terminal-section-title {
  color: var(--text-main);
  font-size: 0.82rem;
  font-weight: 800;
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
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--agent-signal) 12%, var(--border-strong));
  background: color-mix(in srgb, var(--surface-elevated) 94%, transparent);
  padding: 0.85rem 0.9rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.68);
}

.terminal-analysis {
  display: grid;
  border-top: 1px solid var(--border-base);
}

.terminal-analysis-row {
  display: grid;
  grid-template-columns: 5.2rem minmax(0, 1fr);
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-base);
}

.terminal-analysis-label,
.terminal-timeline-heading {
  color: var(--agent-signal-deep);
  font-size: 0.7rem;
  font-weight: 800;
}

.terminal-analysis-copy {
  color: var(--text-secondary);
  font-size: 0.86rem;
  line-height: 1.6;
}

.terminal-timeline-heading {
  display: block;
  margin-bottom: 0.55rem;
}

.terminal-timeline-list {
  display: grid;
}

.terminal-timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 0.7rem minmax(0, 1fr);
  gap: 0.6rem;
  padding: 0.25rem 0 0.75rem;
}

.terminal-timeline-item:not(:last-child)::before {
  content: "";
  position: absolute;
  top: 0.8rem;
  bottom: 0;
  left: 0.28rem;
  width: 1px;
  background: var(--border-strong);
}

.terminal-timeline-mark {
  position: relative;
  z-index: 1;
  width: 0.58rem;
  height: 0.58rem;
  margin-top: 0.3rem;
  border: 2px solid var(--surface-elevated);
  border-radius: 50%;
  background: var(--text-muted);
  box-shadow: 0 0 0 1px var(--border-strong);
}

.terminal-timeline-mark.is-analysis {
  background: var(--agent-signal-deep);
}

.terminal-timeline-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.15rem;
}

.terminal-timeline-label {
  color: var(--text-main);
  font-size: 0.84rem;
  line-height: 1.45;
}

.terminal-timeline-meta {
  color: var(--text-muted);
  font-size: 0.68rem;
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

  .terminal-analysis-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.25rem;
  }
}
</style>
