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

const DEFAULT_PROFILE_CONTENT = {
  owner: {
    name: '',
    name_localized: { zh: '', en: '' },
    role: { zh: '', en: '' },
    bio: { zh: '', en: '' },
    responsibilities: { zh: [], en: [] },
    contacts: [],
    skill_groups: [],
    avatar_media_id: null,
    canonical_url: null
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

const parseProfileContent = (value) => {
  const source = parsePossibleJson(value)
  const owner = isPlainObject(source.owner) ? source.owner : {}
  const nameFallback = {
    zh: normalizeText(owner.name, DEFAULT_PROFILE_CONTENT.owner.name),
    en: normalizeText(owner.name, DEFAULT_PROFILE_CONTENT.owner.name)
  }
  const contacts = Array.isArray(owner.contacts)
    ? owner.contacts
        .filter(contact => isPlainObject(contact))
        .map(contact => ({
          id: normalizeText(contact.id),
          label: normalizeText(contact.label, normalizeText(contact.label?.zh ?? contact.label?.en)),
          href: normalizeText(contact.href ?? contact.url)
        }))
        .filter(contact => contact.label && contact.href)
    : DEFAULT_PROFILE_CONTENT.owner.contacts
  const skillGroups = Array.isArray(owner.skill_groups ?? owner.skillGroups)
    ? (owner.skill_groups ?? owner.skillGroups)
        .filter(group => isPlainObject(group))
        .map(group => ({
          id: normalizeText(group.id),
          name: readLocalizedText(group, 'name', { zh: '', en: '' }),
          items: normalizeList(group.items)
        }))
        .filter(group => group.id && group.name.zh && group.name.en && group.items.length > 0)
    : DEFAULT_PROFILE_CONTENT.owner.skill_groups

  return {
    owner: {
      name: normalizeText(owner.name, DEFAULT_PROFILE_CONTENT.owner.name),
      name_localized: readLocalizedText(owner, 'name_localized', nameFallback),
      role: readLocalizedText(owner, 'role', DEFAULT_PROFILE_CONTENT.owner.role),
      bio: readLocalizedText(owner, 'bio', DEFAULT_PROFILE_CONTENT.owner.bio),
      responsibilities: readLocalizedList(owner, 'responsibilities', DEFAULT_PROFILE_CONTENT.owner.responsibilities),
      contacts,
      skill_groups: skillGroups,
      avatar_media_id: normalizeText(owner.avatar_media_id ?? owner.avatarMediaId) || null,
      canonical_url: normalizeText(owner.canonical_url ?? owner.canonicalUrl) || null
    }
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

const mergeProfileContent = (currentValue, nextValue) => {
  const current = parseProfileContent(currentValue)
  const source = parsePossibleJson(nextValue)
  const nextOwner = isPlainObject(source.owner) ? source.owner : source
  const owner = current.owner

  return {
    owner: {
      name: normalizeText(nextOwner.name, owner.name),
      name_localized: readLocalizedText(nextOwner, 'name_localized', owner.name_localized),
      role: readLocalizedText(nextOwner, 'role', owner.role),
      bio: readLocalizedText(nextOwner, 'bio', owner.bio),
      responsibilities: readLocalizedList(nextOwner, 'responsibilities', owner.responsibilities),
      contacts: Array.isArray(nextOwner.contacts)
        ? parseProfileContent({ owner: { ...owner, contacts: nextOwner.contacts } }).owner.contacts
        : owner.contacts,
      skill_groups: Array.isArray(nextOwner.skill_groups ?? nextOwner.skillGroups)
        ? parseProfileContent({ owner: { ...owner, skill_groups: nextOwner.skill_groups ?? nextOwner.skillGroups } }).owner.skill_groups
        : owner.skill_groups,
      avatar_media_id: nextOwner.avatar_media_id !== undefined || nextOwner.avatarMediaId !== undefined
        ? normalizeText(nextOwner.avatar_media_id ?? nextOwner.avatarMediaId) || null
        : owner.avatar_media_id,
      canonical_url: nextOwner.canonical_url !== undefined || nextOwner.canonicalUrl !== undefined
        ? normalizeText(nextOwner.canonical_url ?? nextOwner.canonicalUrl) || null
        : owner.canonical_url
    }
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
      homepage_content: parseHomepageContent(settings.homepage_content),
      profile_content: parseProfileContent(settings.profile_content)
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
    const { location, timezone, ip_address, homepage_content, homepageContent, profile_content, profileContent } = data
    const currentSettings = this.get()
    let mergedProfileContent = null
    
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

    if (profile_content !== undefined || profileContent !== undefined) {
      mergedProfileContent = mergeProfileContent(
        currentSettings?.profile_content,
        profile_content !== undefined ? profile_content : profileContent
      )

      updateFields.push('profile_content = ?')
      updateValues.push(JSON.stringify(mergedProfileContent))
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

    // The legacy settings endpoint remains a compatibility writer. Once the
    // structured resume tables exist, mirror its profile edits into the
    // authoritative profile record so old admin clients cannot fork identity.
    if (mergedProfileContent && db.prepare(`
      SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'resume_profile'
    `).get()) {
      const owner = mergedProfileContent.owner
      db.prepare(`
        UPDATE resume_profile SET
          name_zh = ?, name_en = ?, headline_zh = ?, headline_en = ?,
          summary_zh = ?, summary_en = ?, updated_at = ?
        WHERE id = 1
      `).run(
        owner.name_localized.zh || owner.name,
        owner.name_localized.en || owner.name,
        owner.role.zh,
        owner.role.en,
        owner.bio.zh,
        owner.bio.en,
        new Date().toISOString()
      )
    }

    return this.get()
  }
}
