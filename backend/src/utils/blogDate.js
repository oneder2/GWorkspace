const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const pad = (value) => String(value).padStart(2, '0')

export const isDateOnlyString = (value) => (
  typeof value === 'string' && DATE_ONLY_PATTERN.test(value.trim())
)

export const getTodayDateString = () => {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export const normalizePublishedAt = (value) => {
  if (value === undefined) return undefined
  if (value === null) return null

  const rawValue = typeof value === 'string' ? value.trim() : value
  if (rawValue === '') return null

  if (isDateOnlyString(rawValue)) {
    return rawValue
  }

  const date = new Date(rawValue)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const formatPosterDate = (value) => {
  const normalized = normalizePublishedAt(value)
  if (!normalized) return ''
  return normalized.replace(/-/g, '.')
}
