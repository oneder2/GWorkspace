const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const pad = (value) => String(value).padStart(2, '0')

export const isDateOnlyString = (value) => (
  typeof value === 'string' && DATE_ONLY_PATTERN.test(value.trim())
)

export const getTodayDateString = () => {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export const getBlogDateValue = (blog) => blog?.published_at || blog?.date || ''

const getDatePartsFromInput = (value) => {
  if (!value) return null

  if (isDateOnlyString(value)) {
    const [year, month, day] = value.trim().split('-').map(Number)
    return { year, month, day, hours: 0, minutes: 0 }
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes()
  }
}

export const formatBlogDate = (value, locale = 'iso') => {
  const parts = getDatePartsFromInput(value)
  if (!parts) return typeof value === 'string' ? value : ''

  if (locale === 'zh') {
    return `${parts.year}年${parts.month}月${parts.day}日`
  }

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
}

export const formatBlogDateTime = (value) => {
  if (!value) return ''
  if (isDateOnlyString(value)) {
    return formatBlogDate(value)
  }

  const parts = getDatePartsFromInput(value)
  if (!parts) return typeof value === 'string' ? value : ''

  return `${formatBlogDate(value)} ${pad(parts.hours)}:${pad(parts.minutes)}`
}

export const formatBlogArchiveLabelFromKey = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value.trim())) {
    return ''
  }

  const [year, month] = value.trim().split('-').map(Number)
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  if (month < 1 || month > 12) {
    return ''
  }

  return `${monthNames[month - 1]} ${year}`
}

export const formatBlogArchiveKey = (value) => {
  const parts = getDatePartsFromInput(value)
  if (!parts) return ''
  return `${parts.year}-${pad(parts.month)}`
}

export const formatBlogArchiveLabel = (value) => {
  const archiveKey = formatBlogArchiveKey(value)
  return formatBlogArchiveLabelFromKey(archiveKey)
}
