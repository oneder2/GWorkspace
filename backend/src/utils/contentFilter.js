/**
 * 内容过滤工具
 * 提供敏感词过滤功能，支持扩展敏感词库
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 敏感词库文件路径
 */
const WORDS_FILE = path.join(__dirname, 'sensitiveWords.json')

/**
 * 敏感词库
 * 从JSON文件加载，支持动态更新
 */
let sensitiveWords = []

/**
 * 正则表达式缓存
 * 存储预编译的正则表达式，避免重复创建
 * @type {Array<{word: string, regex: RegExp}>}
 */
let cachedRegexs = []

/**
 * 转义正则表达式特殊字符
 * @param {string} string 
 * @returns {string}
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 为敏感词生成正则表达式
 * @param {string} word 
 * @returns {RegExp}
 */
function generateRegex(word) {
  const escapedWord = escapeRegExp(word)
  if (/^[\u4e00-\u9fa5]+$/.test(word)) {
    // 中文：直接匹配（不转小写，但在构建正则时使用 'i' 标志以防万一）
    return new RegExp(escapedWord, 'gi')
  } else {
    // 英文：使用单词边界匹配
    return new RegExp(`\\b${escapedWord}\\b`, 'gi')
  }
}

/**
 * 更新正则缓存
 */
function updateRegexCache() {
  cachedRegexs = sensitiveWords.map(word => ({
    word,
    regex: generateRegex(word)
  }))
  console.log(`[ContentFilter] Updated regex cache with ${cachedRegexs.length} patterns`)
}

/**
 * 从文件加载敏感词库
 */
function loadSensitiveWords() {
  try {
    if (fs.existsSync(WORDS_FILE)) {
      const fileContent = fs.readFileSync(WORDS_FILE, 'utf-8')
      const data = JSON.parse(fileContent)
      sensitiveWords = Array.isArray(data.words) ? data.words : []
      console.log(`[ContentFilter] Loaded ${sensitiveWords.length} sensitive words from file`)
    } else {
      // 如果文件不存在，使用默认词库
      sensitiveWords = ['spam', 'advertisement', 'promotion']
      console.warn(`[ContentFilter] Words file not found, using default words`)
      // 创建默认文件
      saveSensitiveWords()
    }
    // 更新缓存
    updateRegexCache()
  } catch (error) {
    console.error('[ContentFilter] Error loading sensitive words:', error)
    // 使用默认词库
    sensitiveWords = ['spam', 'advertisement', 'promotion']
    updateRegexCache()
  }
}

/**
 * 保存敏感词库到文件
 */
function saveSensitiveWords() {
  try {
    const data = {
      words: sensitiveWords,
      notes: "敏感词库 - 每行一个词，支持中英文。添加新词后需要重启服务器。",
      updated_at: new Date().toISOString()
    }
    fs.writeFileSync(WORDS_FILE, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`[ContentFilter] Saved ${sensitiveWords.length} sensitive words to file`)
  } catch (error) {
    console.error('[ContentFilter] Error saving sensitive words:', error)
  }
}

/**
 * 初始化：加载敏感词库
 */
loadSensitiveWords()

/**
 * 检查内容是否包含敏感词
 * @param {string} content - 要检查的内容
 * @returns {boolean} 是否包含敏感词
 */
export function containsSensitiveWords(content) {
  if (!content || typeof content !== 'string') {
    return false
  }
  
  // 使用缓存的正则进行检查
  return cachedRegexs.some(({ regex }) => regex.test(content))
}

/**
 * 过滤敏感词（替换为*）
 * @param {string} content - 要过滤的内容
 * @returns {string} 过滤后的内容
 */
export function filterSensitiveWords(content) {
  if (!content || typeof content !== 'string') {
    return content
  }

  let filteredContent = content
  
  cachedRegexs.forEach(({ word, regex }) => {
    filteredContent = filteredContent.replace(regex, '*'.repeat(word.length))
  })
  
  return filteredContent
}

/**
 * 添加敏感词到词库
 * @param {string|Array<string>} wordOrWords - 要添加的敏感词（可以是单个词或词数组）
 * @returns {boolean} 是否成功添加（如果已存在则返回false）
 */
export function addSensitiveWord(wordOrWords) {
  let added = false
  const wordsToAdd = Array.isArray(wordOrWords) ? wordOrWords : [wordOrWords]
  
  wordsToAdd.forEach(word => {
    if (word && typeof word === 'string') {
      const normalizedWord = word.toLowerCase().trim()
      if (normalizedWord && !sensitiveWords.includes(normalizedWord)) {
        sensitiveWords.push(normalizedWord)
        added = true
      }
    }
  })
  
  if (added) {
    saveSensitiveWords()
    updateRegexCache() // 更新缓存
  }
  
  return added
}

/**
 * 批量添加敏感词（从文本内容导入，支持换行分隔）
 * @param {string} text - 包含敏感词的文本，每行一个词
 * @returns {number} 成功添加的词数
 */
export function addSensitiveWordsFromText(text) {
  if (!text || typeof text !== 'string') {
    return 0
  }
  
  const words = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
  
  let addedCount = 0
  words.forEach(word => {
    if (addSensitiveWord(word)) {
      addedCount++
    }
  })
  
  if (addedCount > 0) {
    saveSensitiveWords()
  }
  
  return addedCount
}

/**
 * 移除敏感词
 * @param {string} word - 要移除的敏感词
 * @returns {boolean} 是否成功移除
 */
export function removeSensitiveWord(word) {
  if (!word || typeof word !== 'string') {
    return false
  }
  
  const normalizedWord = word.toLowerCase().trim()
  const index = sensitiveWords.indexOf(normalizedWord)
  
  if (index > -1) {
    sensitiveWords.splice(index, 1)
    saveSensitiveWords()
    updateRegexCache()
    return true
  }
  
  return false
}

/**
 * 获取敏感词列表（用于管理）
 * @returns {Array<string>} 敏感词列表的副本
 */
export function getSensitiveWords() {
  return [...sensitiveWords]
}

/**
 * 重新加载敏感词库（从文件）
 * 用于在运行时更新词库而不重启服务器
 */
export function reloadSensitiveWords() {
  loadSensitiveWords()
  return sensitiveWords.length
}

