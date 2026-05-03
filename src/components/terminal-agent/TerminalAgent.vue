<template>
  <teleport to="body">
    <TerminalLauncher
      :copy="copy"
      :open="isOpen"
      :state="launcherState"
      @toggle="togglePanel"
    />
  </teleport>

  <FloatingTerminalPanel
    :copy="copy"
    :current-command="currentCommand"
    :empty-state="emptyState"
    :history="history"
    :open="isOpen"
    :prompt="prompt"
    :state="launcherState"
    @close="closePanel"
    @execute="executeCommand"
    @link-activate="handleLinkActivate"
    @navigate-history="navigateHistory"
    @update:current-command="setCurrentCommand"
  />
</template>

<script setup>
import FloatingTerminalPanel from './FloatingTerminalPanel.vue'
import TerminalLauncher from './TerminalLauncher.vue'
import { useTerminalAgent } from '../../composables/useTerminalAgent'

const {
  copy,
  currentCommand,
  emptyState,
  executeCommand,
  handleLinkActivate,
  history,
  isOpen,
  launcherState,
  navigateHistory,
  prompt,
  setCurrentCommand,
  togglePanel,
  closePanel
} = useTerminalAgent()
</script>
