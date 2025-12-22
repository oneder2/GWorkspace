#!/usr/bin/env node
/**
 * 批量导入敏感词脚本
 * 用法: node scripts/import-sensitive-words.js [words_file.txt]
 * 
 * 如果没有指定文件，将从标准输入读取
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createInterface } from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const wordsFile = join(__dirname, '../src/utils/sensitiveWords.json')

/**
 * 读取现有词库
 */
function loadExistingWords() {
  try {
    if (existsSync(wordsFile)) {
      const content = readFileSync(wordsFile, 'utf-8')
      const data = JSON.parse(content)
      return {
        words: data.words || [],
        notes: data.notes || '敏感词库'
      }
    }
  } catch (error) {
    console.error('读取现有词库失败:', error.message)
  }
  
  return {
    words: [],
    notes: '敏感词库'
  }
}

/**
 * 从文件读取新词
 */
function readWordsFromFile(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#')) // 支持 # 注释
    .map(word => word.toLowerCase())
}

/**
 * 从标准输入读取
 */
async function readWordsFromStdin() {
  const words = []
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  })
  
  for await (const line of rl) {
    const word = line.trim()
    if (word && !word.startsWith('#')) {
      words.push(word.toLowerCase())
    }
  }
  
  return words
}

/**
 * 保存词库
 */
function saveWords(words, notes) {
  const data = {
    words: words,
    notes: notes,
    updated_at: new Date().toISOString()
  }
  writeFileSync(wordsFile, JSON.stringify(data, null, 2), 'utf-8')
}

/**
 * 主函数
 */
async function main() {
  const existing = loadExistingWords()
  const existingSet = new Set(existing.words.map(w => w.toLowerCase()))
  
  let newWords = []
  
  // 从命令行参数读取文件，或从标准输入读取
  const inputFile = process.argv[2]
  
  if (inputFile) {
    if (!existsSync(inputFile)) {
      console.error(`错误: 文件不存在: ${inputFile}`)
      process.exit(1)
    }
    console.log(`从文件读取: ${inputFile}`)
    newWords = readWordsFromFile(inputFile)
  } else {
    console.log('从标准输入读取（Ctrl+D 结束输入）:')
    newWords = await readWordsFromStdin()
  }
  
  if (newWords.length === 0) {
    console.log('没有新词可导入')
    return
  }
  
  // 合并并去重
  const allWords = [...existingSet]
  let addedCount = 0
  
  newWords.forEach(word => {
    if (!existingSet.has(word)) {
      allWords.push(word)
      addedCount++
    }
  })
  
  // 排序
  allWords.sort()
  
  // 保存
  saveWords(allWords, existing.notes)
  
  console.log(`\n导入完成:`)
  console.log(`  原有词数: ${existingSet.size}`)
  console.log(`  新增词数: ${addedCount}`)
  console.log(`  重复词数: ${newWords.length - addedCount}`)
  console.log(`  总计词数: ${allWords.length}`)
  console.log(`\n词库已保存到: ${wordsFile}`)
  console.log(`请重启服务器以使新词库生效`)
}

main().catch(error => {
  console.error('错误:', error)
  process.exit(1)
})

