<template>
  <teleport to="body">
    <TerminalLauncher
      :copy="copy"
      :open="isOpen"
      :state="launcherState"
      @toggle="togglePanel"
      @position="anchor = $event"
    />
  </teleport>

  <FloatingTerminalPanel
    :anchor="anchor"
    :copy="copy"
    :current-command="currentCommand"
    :empty-state="emptyState"
    :history="history"
    :focus-token="focusToken"
    :open="isOpen"
    :prompt="prompt"
    :state="launcherState"
    @close="closePanel"
    @execute="executeCommand"
    @link-activate="handleLinkActivate"
    @navigate-history="navigateHistory"
    @select-action="selectAction"
    @update:current-command="setCurrentCommand"
  />
</template>

<script setup>
import { ref } from 'vue'
const anchor = ref({ x: window.innerWidth - 68, y: window.innerHeight - 88 })
import FloatingTerminalPanel from './FloatingTerminalPanel.vue'
import TerminalLauncher from './TerminalLauncher.vue'
import { useTerminalAgent } from '../../composables/useTerminalAgent'

const {
  copy,
  currentCommand,
  emptyState,
  executeCommand,
  focusToken,
  handleLinkActivate,
  history,
  isOpen,
  launcherState,
  navigateHistory,
  prompt,
  selectAction,
  setCurrentCommand,
  togglePanel,
  closePanel
} = useTerminalAgent()
</script>
