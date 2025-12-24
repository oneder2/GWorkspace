/**
 * 管理员设置数据模型
 * 管理管理员的位置、时区等配置信息
 * 使用单行表设计，始终只有一条记录（id=1）
 */

import { getDatabase } from '../config/database.js'

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
    return settings || null
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
    const { location, timezone, ip_address } = data
    
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

