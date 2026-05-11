<template>
  <teleport to="body">
    <transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="terminal-panel-layer">
        <div class="terminal-panel-backdrop" aria-hidden="true"></div>

        <transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-6 md:translate-y-4 md:translate-x-4 scale-[0.98]"
          enter-to-class="opacity-100 translate-y-0 translate-x-0 scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0 translate-x-0 scale-100"
          leave-to-class="opacity-0 translate-y-6 md:translate-y-4 md:translate-x-4 scale-[0.98]"
        >
          <section v-if="open" class="terminal-panel surface-float">
            <TerminalHeader :copy="copy" :state="state" @close="$emit('close')" />

            <div class="terminal-panel-body">
              <TerminalOutput
                :entries="history"
                :empty-state="emptyState"
                :prompt="prompt"
                @link-activate="$emit('link-activate')"
              />
            </div>

            <div class="terminal-panel-footer divider-strong-t">
              <TerminalInput
                ref="inputRef"
                :model-value="currentCommand"
                :placeholder="copy.ui.inputPlaceholder"
                :prompt="prompt"
                @navigate-history="$emit('navigate-history', $event)"
                @submit="$emit('execute')"
                @update:model-value="$emit('update:currentCommand', $event)"
              />
            </div>
          </section>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import TerminalHeader from './TerminalHeader.vue'
import TerminalInput from './TerminalInput.vue'
import TerminalOutput from './TerminalOutput.vue'

const props = defineProps({
  copy: {
    type: Object,
    required: true
  },
  currentCommand: {
    type: String,
    required: true
  },
  emptyState: {
    type: Object,
    required: true
  },
  history: {
    type: Array,
    required: true
  },
  open: {
    type: Boolean,
    default: false
  },
  prompt: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  }
})

defineEmits(['close', 'execute', 'link-activate', 'navigate-history', 'update:currentCommand'])

const inputRef = ref(null)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      return
    }

    nextTick(() => {
      inputRef.value?.focusInput()
    })
  }
)
</script>

<style scoped>
.terminal-panel-layer {
  position: fixed;
  inset: 0;
  z-index: 95;
  pointer-events: none;
}

.terminal-panel-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at bottom right, color-mix(in srgb, var(--agent-signal) 12%, transparent), transparent 32%);
}

.terminal-panel {
  position: absolute;
  right: 1rem;
  bottom: 5.8rem;
  display: flex;
  width: min(28rem, calc(100vw - 2rem));
  height: min(37rem, calc(100vh - 8rem));
  flex-direction: column;
  overflow: hidden;
  border-radius: 30px;
  pointer-events: auto;
  border-color: color-mix(in srgb, var(--agent-signal) 16%, var(--border-base));
}

.terminal-panel-body {
  flex: 1;
  min-height: 0;
  padding: 0.75rem 0.95rem 0.6rem;
}

.terminal-panel-footer {
  padding: 0.95rem 1rem 1rem;
}

@media (max-width: 767px) {
  .terminal-panel {
    left: 0.75rem;
    right: 0.75rem;
    bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
    width: auto;
    height: min(76vh, 40rem);
    border-radius: 28px;
  }
}
</style>
