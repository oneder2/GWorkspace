/**
 * 管理员设置数据模型
 * 管理管理员的位置、时区等配置信息
 * 使用单行表设计，始终只有一条记录（id=1）
 */

import { getDatabase } from '../config/database.js'

const DEFAULT_HOMEPAGE_CONTENT = {
  status: {
    zh: '',
    en: ''
  },
  slogan: {
    zh: '',
    en: ''
  },
  tasks: {
    zh: '',
    en: ''
  }
}

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const normalizeText = (value, fallback = '') => (typeof value === 'string' ? value.trim() : fallback)

const normalizeList = (value, fallback = []) => {
  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
  }

  return Array.isArray(fallback) ? [...fallback] : []
}

const parsePossibleJson = (value) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return {}
    }
  }

  return isPlainObject(value) ? value : {}
}

const readLocalizedText = (source, key, fallback) => {
  const group = isPlainObject(source?.[key]) ? source[key] : {}
  return {
    zh: normalizeText(group.zh ?? source?.[`${key}Zh`] ?? fallback.zh, fallback.zh),
    en: normalizeText(group.en ?? source?.[`${key}En`] ?? fallback.en, fallback.en)
  }
}

const readLocalizedList = (source, key, fallback) => {
  const group = isPlainObject(source?.[key]) ? source[key] : {}
  return {
    zh: normalizeList(group.zh ?? source?.[`${key}Zh`], fallback.zh),
    en: normalizeList(group.en ?? source?.[`${key}En`], fallback.en)
  }
}

const parseHomepageContent = (value) => {
  const source = parsePossibleJson(value)
  const normalizedSource = {
    ...source,
    tasks: source.tasks ?? source.fallbackTasks,
    tasksZh: source.tasksZh ?? source.fallbackTasksZh,
    tasksEn: source.tasksEn ?? source.fallbackTasksEn
  }

  return {
    status: readLocalizedText(normalizedSource, 'status', DEFAULT_HOMEPAGE_CONTENT.status),
    slogan: readLocalizedText(normalizedSource, 'slogan', DEFAULT_HOMEPAGE_CONTENT.slogan),
    tasks: readLocalizedList(normalizedSource, 'tasks', DEFAULT_HOMEPAGE_CONTENT.tasks)
  }
}

const mergeHomepageContent = (currentValue, nextValue) => {
  const current = parseHomepageContent(currentValue)
  const source = parsePossibleJson(nextValue)
  const normalizedSource = {
    ...source,
    tasks: source.tasks ?? source.fallbackTasks,
    tasksZh: source.tasksZh ?? source.fallbackTasksZh,
    tasksEn: source.tasksEn ?? source.fallbackTasksEn
  }

  return {
    status: readLocalizedText(normalizedSource, 'status', current.status),
    slogan: readLocalizedText(normalizedSource, 'slogan', current.slogan),
    tasks: readLocalizedList(normalizedSource, 'tasks', current.tasks)
  }
}

/**
 * 管理员设置模型类
 */
export class AdminSettings {
  /**
   * 获取管理员设置
   * @returns {Object|null} 管理员设置对象
   */
  static get() {
    const db = getDatabase()
    const settings = db.prepare('SELECT * FROM admin_settings WHERE id = 1').get()
    if (!settings) {
      return null
    }

    return {
      ...settings,
      homepage_content: parseHomepageContent(settings.homepage_content)
    }
  }

  /**
   * 更新管理员设置
   * @param {Object} data - 设置数据
   * @param {string} data.location - 位置信息（可选）
   * @param {string} data.timezone - 时区信息（可选）
   * @param {string} data.ip_address - IP地址（可选）
   * @param {number} updatedBy - 更新者用户ID（可选）
   * @returns {Object} 更新后的设置对象
   */
  static update(data, updatedBy = null) {
    const db = getDatabase()
    const { location, timezone, ip_address, homepage_content, homepageContent } = data
    const currentSettings = this.get()
    
    const updateFields = []
    const updateValues = []

    if (location !== undefined) {
      updateFields.push('location = ?')
      updateValues.push(location)
    }

    if (timezone !== undefined) {
      updateFields.push('timezone = ?')
      updateValues.push(timezone)
    }

    if (ip_address !== undefined) {
      updateFields.push('ip_address = ?')
      updateValues.push(ip_address)
    }

    if (homepage_content !== undefined || homepageContent !== undefined) {
      const mergedHomepageContent = mergeHomepageContent(
        currentSettings?.homepage_content,
        homepage_content !== undefined ? homepage_content : homepageContent
      )

      updateFields.push('homepage_content = ?')
      updateValues.push(JSON.stringify(mergedHomepageContent))
    }

    // 更新updated_at和updated_by
    updateFields.push('updated_at = ?')
    updateValues.push(new Date().toISOString())

    if (updatedBy !== null) {
      updateFields.push('updated_by = ?')
      updateValues.push(updatedBy)
    }

    // 执行更新
    if (updateFields.length > 1) { // 至少包含updated_at
      const query = `UPDATE admin_settings SET ${updateFields.join(', ')} WHERE id = 1`
      db.prepare(query).run(...updateValues)
    }

    return this.get()
  }
}
