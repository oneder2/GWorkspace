import { ensureDailyCapsule } from './aiWorkflow.js'

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000

let schedulerHandle = null

const runEnsure = async (logger = console) => {
  try {
    await ensureDailyCapsule()
  } catch (error) {
    logger.error?.('AI daily capsule scheduler failed:', error)
  }
}

export function startAiDailyCapsuleScheduler(options = {}) {
  if (schedulerHandle) {
    return schedulerHandle
  }

  const logger = options.logger || console
  const intervalMs = Number.parseInt(options.interval_ms, 10) || DEFAULT_INTERVAL_MS

  void runEnsure(logger)

  schedulerHandle = setInterval(() => {
    void runEnsure(logger)
  }, intervalMs)

  if (typeof schedulerHandle.unref === 'function') {
    schedulerHandle.unref()
  }

  return schedulerHandle
}

export function stopAiDailyCapsuleScheduler() {
  if (!schedulerHandle) {
    return
  }

  clearInterval(schedulerHandle)
  schedulerHandle = null
}
