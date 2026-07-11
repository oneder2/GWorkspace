<template>
  <div class="time-suite">
    <div class="time-suite-tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="time-suite-tab"
        :class="{ 'is-active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <section v-if="activeTab === 'clock'" class="time-suite-panel">
      <div class="time-clock-grid">
        <article v-for="zone in zones" :key="zone.id" class="time-clock-card">
          <span class="time-card-label">{{ zone.label }}</span>
          <strong class="time-clock-value">{{ formatZoneTime(zone.timeZone) }}</strong>
          <span class="time-card-copy">{{ formatZoneDate(zone.timeZone) }}</span>
        </article>
      </div>
    </section>

    <section v-else-if="activeTab === 'stopwatch'" class="time-suite-panel time-center-panel">
      <span class="time-card-label">{{ $t('timeSuite.stopwatchLap') }}</span>
      <strong class="time-display">{{ formatStopwatch(stopwatchTime) }}</strong>
      <span class="time-card-copy">{{ formatStopwatch(lapTime) }}</span>
      <div class="time-actions">
        <button type="button" class="time-primary-btn" @click="toggleStopwatch">
          {{ stopwatchRunning ? $t('timeSuite.stop') : $t('timeSuite.start') }}
        </button>
        <button type="button" class="time-secondary-btn" :disabled="!stopwatchRunning && stopwatchTime === 0" @click="recordLap">
          {{ $t('timeSuite.lap') }}
        </button>
        <button type="button" class="time-secondary-btn" :disabled="stopwatchRunning" @click="resetStopwatch">
          {{ $t('timeSuite.reset') }}
        </button>
      </div>
      <div v-if="laps.length" class="time-lap-list">
        <div v-for="(lap, index) in laps" :key="`${lap}-${index}`" class="time-lap-row">
          <span>{{ $t('timeSuite.lapIndex', { count: laps.length - index }) }}</span>
          <span>{{ formatStopwatch(lap) }}</span>
        </div>
      </div>
    </section>

    <section v-else-if="activeTab === 'timer'" class="time-suite-panel time-center-panel">
      <span class="time-card-label">{{ $t('timeSuite.timer') }}</span>
      <strong class="time-display">{{ formatCountdown(timerRemaining) }}</strong>
      <div class="time-presets">
        <button
          v-for="preset in timerPresets"
          :key="preset"
          type="button"
          class="time-preset-btn"
          :disabled="timerRunning"
          @click="setTimer(preset)"
        >
          {{ preset }}m
        </button>
      </div>
      <div class="time-actions">
        <button type="button" class="time-primary-btn" @click="toggleTimer">
          {{ timerRunning ? $t('timeSuite.pause') : $t('timeSuite.start') }}
        </button>
        <button type="button" class="time-secondary-btn" @click="resetTimer">
          {{ $t('timeSuite.reset') }}
        </button>
      </div>
    </section>

    <section v-else class="time-suite-panel time-center-panel">
      <span class="time-card-label">{{ pomodoroMode === 'work' ? $t('timeSuite.focus') : $t('timeSuite.break') }}</span>
      <strong class="time-display">{{ formatCountdown(pomodoroRemaining) }}</strong>
      <div class="time-presets">
        <button
          type="button"
          class="time-preset-btn"
          :class="{ 'is-active': pomodoroMode === 'work' }"
          :disabled="pomodoroRunning"
          @click="setPomodoroMode('work')"
        >
          {{ $t('timeSuite.focusMode') }}
        </button>
        <button
          type="button"
          class="time-preset-btn"
          :class="{ 'is-active': pomodoroMode === 'break' }"
          :disabled="pomodoroRunning"
          @click="setPomodoroMode('break')"
        >
          {{ $t('timeSuite.breakMode') }}
        </button>
      </div>
      <div class="time-actions">
        <button type="button" class="time-primary-btn" @click="togglePomodoro">
          {{ pomodoroRunning ? $t('timeSuite.pause') : $t('timeSuite.start') }}
        </button>
        <button type="button" class="time-secondary-btn" @click="resetPomodoro">
          {{ $t('timeSuite.reset') }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const activeTab = ref('clock')
const currentTime = ref(new Date())

const tabs = computed(() => [
  { id: 'clock', label: t('timeSuite.clock') },
  { id: 'stopwatch', label: t('timeSuite.stopwatch') },
  { id: 'timer', label: t('timeSuite.timer') },
  { id: 'pomodoro', label: t('timeSuite.pomodoro') }
])

const zones = computed(() => [
  { id: 'local', label: t('timeSuite.local'), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  { id: 'shanghai', label: t('tools.worldClock.china'), timeZone: 'Asia/Shanghai' },
  { id: 'new-york', label: t('tools.worldClock.usEast'), timeZone: 'America/New_York' },
  { id: 'los-angeles', label: t('tools.worldClock.usWest'), timeZone: 'America/Los_Angeles' }
])

const clockTimer = window.setInterval(() => {
  currentTime.value = new Date()
}, 1000)

const stopwatchTime = ref(0)
const lapTime = ref(0)
const stopwatchRunning = ref(false)
const laps = ref([])
let stopwatchInterval = null
let stopwatchStart = 0
let lapStart = 0

const timerPresets = [5, 10, 25, 45]
const timerDuration = ref(10 * 60 * 1000)
const timerRemaining = ref(timerDuration.value)
const timerRunning = ref(false)
let timerInterval = null

const pomodoroMode = ref('work')
const pomodoroRemaining = ref(25 * 60 * 1000)
const pomodoroRunning = ref(false)
let pomodoroInterval = null

function formatZoneTime(timeZone) {
  return currentTime.value.toLocaleTimeString(undefined, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

function formatZoneDate(timeZone) {
  return currentTime.value.toLocaleDateString(undefined, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function formatStopwatch(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const centiseconds = Math.floor((ms % 1000) / 10)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function toggleStopwatch() {
  if (stopwatchRunning.value) {
    window.clearInterval(stopwatchInterval)
    stopwatchRunning.value = false
    return
  }

  const now = Date.now()
  stopwatchStart = now - stopwatchTime.value
  lapStart = now - lapTime.value
  stopwatchRunning.value = true
  stopwatchInterval = window.setInterval(() => {
    const current = Date.now()
    stopwatchTime.value = current - stopwatchStart
    lapTime.value = current - lapStart
  }, 10)
}

function recordLap() {
  if (!stopwatchRunning.value || lapTime.value <= 0) return
  laps.value.unshift(lapTime.value)
  lapTime.value = 0
  lapStart = Date.now()
}

function resetStopwatch() {
  window.clearInterval(stopwatchInterval)
  stopwatchRunning.value = false
  stopwatchTime.value = 0
  lapTime.value = 0
  laps.value = []
}

function setTimer(minutes) {
  timerDuration.value = minutes * 60 * 1000
  timerRemaining.value = timerDuration.value
}

function toggleTimer() {
  if (timerRunning.value) {
    window.clearInterval(timerInterval)
    timerRunning.value = false
    return
  }

  timerRunning.value = true
  timerInterval = window.setInterval(() => {
    timerRemaining.value -= 1000
    if (timerRemaining.value <= 0) {
      resetTimer()
    }
  }, 1000)
}

function resetTimer() {
  window.clearInterval(timerInterval)
  timerRunning.value = false
  timerRemaining.value = timerDuration.value
}

function setPomodoroMode(mode) {
  pomodoroMode.value = mode
  pomodoroRemaining.value = mode === 'work' ? 25 * 60 * 1000 : 5 * 60 * 1000
}

function togglePomodoro() {
  if (pomodoroRunning.value) {
    window.clearInterval(pomodoroInterval)
    pomodoroRunning.value = false
    return
  }

  pomodoroRunning.value = true
  pomodoroInterval = window.setInterval(() => {
    pomodoroRemaining.value -= 1000
    if (pomodoroRemaining.value <= 0) {
      const nextMode = pomodoroMode.value === 'work' ? 'break' : 'work'
      pomodoroRunning.value = false
      window.clearInterval(pomodoroInterval)
      setPomodoroMode(nextMode)
    }
  }, 1000)
}

function resetPomodoro() {
  window.clearInterval(pomodoroInterval)
  pomodoroRunning.value = false
  setPomodoroMode(pomodoroMode.value)
}

onUnmounted(() => {
  window.clearInterval(clockTimer)
  window.clearInterval(stopwatchInterval)
  window.clearInterval(timerInterval)
  window.clearInterval(pomodoroInterval)
})
</script>

<style scoped>
.time-suite {
  display: grid;
  gap: 0.9rem;
  min-height: 100%;
}

.time-suite-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.45rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.48);
  border: 1px solid var(--border-base);
}

.dark .time-suite-tabs {
  background: rgba(15, 23, 42, 0.38);
}

.time-suite-tab,
.time-preset-btn,
.time-primary-btn,
.time-secondary-btn {
  min-height: 2.3rem;
  border-radius: 0.8rem;
  font-size: 0.82rem;
  font-weight: 820;
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.time-suite-tab {
  flex: 1;
  padding: 0 0.9rem;
  color: var(--text-secondary);
}

.time-suite-tab.is-active,
.time-preset-btn.is-active {
  color: var(--text-main);
  background: color-mix(in srgb, var(--theme-primary) 14%, rgba(255, 255, 255, 0.7));
}

.time-suite-panel {
  display: grid;
  gap: 0.85rem;
  padding: 0.9rem;
  border-radius: 1.2rem;
  border: 1px solid var(--border-base);
  background: rgba(255, 255, 255, 0.44);
}

.dark .time-suite-panel {
  background: rgba(15, 23, 42, 0.34);
}

.time-clock-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.72rem;
}

.time-clock-card {
  display: grid;
  gap: 0.35rem;
  padding: 0.9rem;
  border-radius: 1rem;
  border: 1px solid var(--border-base);
  background: rgba(255, 255, 255, 0.45);
}

.dark .time-clock-card {
  background: rgba(15, 23, 42, 0.32);
}

.time-card-label {
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.time-card-copy {
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.time-clock-value,
.time-display {
  color: var(--text-main);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.time-clock-value {
  font-size: clamp(1.7rem, 4vw, 2.6rem);
}

.time-display {
  font-size: clamp(3rem, 10vw, 5rem);
  line-height: 1;
}

.time-center-panel {
  justify-items: center;
  text-align: center;
}

.time-actions,
.time-presets {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.55rem;
}

.time-primary-btn,
.time-secondary-btn,
.time-preset-btn {
  padding: 0 0.9rem;
  border: 1px solid var(--border-base);
}

.time-primary-btn {
  color: white;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-darker));
}

.time-secondary-btn,
.time-preset-btn {
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.48);
}

.dark .time-secondary-btn,
.dark .time-preset-btn {
  background: rgba(15, 23, 42, 0.4);
}

.time-secondary-btn:disabled,
.time-preset-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.time-lap-list {
  display: grid;
  gap: 0.38rem;
  width: min(100%, 28rem);
  max-height: 12rem;
  overflow-y: auto;
}

.time-lap-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.55rem 0.7rem;
  border-radius: 0.78rem;
  color: var(--text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.82rem;
  background: rgba(255, 255, 255, 0.4);
}

.dark .time-lap-row {
  background: rgba(15, 23, 42, 0.34);
}

@media (max-width: 640px) {
  .time-clock-grid {
    grid-template-columns: 1fr;
  }

  .time-suite-tab {
    flex-basis: calc(50% - 0.25rem);
  }
}
</style>
