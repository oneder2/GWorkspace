#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import vm from 'vm'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DEFAULT_OUTPUT_PATH = resolve(__dirname, '../src/utils/aiSeedCatalog.json')
const DEFAULT_SOURCES_ROOT = '/tmp'

const REPO_PATHS = {
  awesome_it_quotes: join(DEFAULT_SOURCES_ROOT, 'awesome-it-quotes'),
  chinese_proverbs: join(DEFAULT_SOURCES_ROOT, 'chinese-proverbs'),
  linsa_quotes: join(DEFAULT_SOURCES_ROOT, 'linsa-quotes')
}

const REPO_META = {
  awesome_it_quotes: {
    source_label: 'awesome-it-quotes',
    source_url: 'https://github.com/victorlaerte/awesome-it-quotes',
    imported_from: 'catalog:awesome-it-quotes',
    language: 'en',
    notes: 'Curated IT quotes parsed from README table rows.'
  },
  chinese_proverbs: {
    source_label: 'chinese-proverbs',
    source_url: 'https://github.com/L0nkC/chinese-proverbs',
    imported_from: 'catalog:chinese-proverbs',
    language: 'multi',
    notes: 'Chinese, Cantonese, Japanese, and Korean proverb data parsed from proverbs.js, japanese-proverbs.js, and korean-proverbs.js.'
  },
  linsa_quotes: {
    source_label: 'linsa-quotes',
    source_url: 'https://github.com/linsa-io/quotes',
    imported_from: 'catalog:linsa-quotes',
    language: 'en',
    notes: 'Thematic quote collection parsed from README blockquotes.'
  }
}

const normalizeWhitespace = (value) => (
  String(value || '')
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .trim()
)

const stripMarkdownLinks = (value) => (
  String(value || '').replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gi, '$1')
)

const normalizeCatalogKey = (value) => normalizeWhitespace(value).toLowerCase()

const stripHtml = (value) => (
  String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
)

const uniqueBy = (items, keyFactory) => {
  const seen = new Set()
  const output = []

  for (const item of items) {
    const key = keyFactory(item)
    if (!key || seen.has(key)) {
      continue
    }
    seen.add(key)
    output.push(item)
  }

  return output
}

const readVmExport = (filePath, exportExpression) => {
  const source = readFileSync(filePath, 'utf8')
  const sandbox = {}

  vm.createContext(sandbox)
  vm.runInContext(`${source}; globalThis.__catalog = ${exportExpression};`, sandbox)

  return sandbox.__catalog || {}
}

function parseAwesomeItQuotes(repoPath) {
  const readme = readFileSync(join(repoPath, 'README.md'), 'utf8')
  const tableStart = readme.indexOf('| Quote | Author |')
  const tableSection = tableStart >= 0 ? readme.slice(tableStart) : readme
  const rows = tableSection
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith('| ') && line.includes('<div id="'))
  const results = []

  for (const row of rows) {
    const parts = row.split('|')
    if (parts.length < 3) {
      continue
    }

    const quoteCell = stripHtml(parts[1] || '')
    const authorCell = parts.slice(2, -1).join('|')
    const anchorMatch = authorCell.match(/<div id="([^"]+)"><\/div>/)
    const authorAnchor = anchorMatch?.[1] || ''
    const authorImageMatch = authorCell.match(/\[\!\[([^\]]+)\]/)
    const authorLine = stripHtml(
      authorCell
        .replace(/<div id="[^"]+"><\/div>/, '')
        .replace(/\[\!\[[^\]]*\]\([^)]+\)\]\([^)]+\)/g, '')
    )
    const authorName = normalizeWhitespace(authorImageMatch?.[1] || authorLine.split('(')[0] || authorAnchor.replace(/-/g, ' '))
    const authorSlug = authorAnchor || authorName.toLowerCase().replace(/\s+/g, '-')

    const quotePieces = quoteCell
      .split(/\n{2,}/)
      .map(piece => normalizeWhitespace(piece.replace(/^["“”]+|["“”]+$/g, '')))
      .filter(Boolean)

    quotePieces.forEach((quote, index) => {
      const cleanedQuote = normalizeWhitespace(quote.replace(/^["“”]+|["“”]+$/g, ''))
      if (!cleanedQuote || cleanedQuote === 'Quote | Author | |:-:|:-:|') {
        return
      }

      results.push({
        id: `awesome-it-quotes:${authorSlug}:${String(index + 1).padStart(2, '0')}`,
        source_text: cleanedQuote,
        author: authorName,
        tags: ['it', 'technology', 'programming'],
        extra: {
          repo: 'awesome-it-quotes',
          author_anchor: authorAnchor
        }
      })
    })
  }

  return results
}

function parseChineseProverbs(repoPath) {
  const chineseData = readVmExport(
    join(repoPath, 'proverbs.js'),
    `({
      chineseProverbs: typeof chineseProverbs !== 'undefined'
        ? chineseProverbs
        : (typeof proverbs !== 'undefined' ? proverbs : []),
      cantoneseProverbs: typeof cantoneseProverbs !== 'undefined' ? cantoneseProverbs : [],
      allProverbs: typeof allProverbs !== 'undefined' ? allProverbs : []
    })`
  )
  const japaneseData = readVmExport(
    join(repoPath, 'japanese-proverbs.js'),
    `({
      japaneseProverbsData: typeof japaneseProverbsData !== 'undefined' ? japaneseProverbsData : []
    })`
  )
  const koreanData = readVmExport(
    join(repoPath, 'korean-proverbs.js'),
    `({
      koreanProverbsData: typeof koreanProverbsData !== 'undefined' ? koreanProverbsData : []
    })`
  )

  const mapProverbEntries = (items, config) => (
    items.map((item, index) => {
      const nativeText = normalizeWhitespace(item?.[config.nativeField] || '')
      const transliteration = normalizeWhitespace(item?.[config.transliterationField] || '')
      const englishMeaning = normalizeWhitespace(item?.en || '')
      const proverbId = item?.id || `${config.idPrefix}-${String(index + 1).padStart(3, '0')}`
      const tags = Array.isArray(item?.cats)
        ? [...new Set(item.cats.map(tag => normalizeWhitespace(tag)).filter(Boolean))]
        : []

      return {
        id: `chinese-proverbs:${proverbId}`,
        source_text: normalizeWhitespace(nativeText),
        author: config.culture,
        language: config.language,
        notes: config.notes,
        tags,
        extra: {
          repo: 'chinese-proverbs',
          proverb_id: proverbId,
          native_text: nativeText,
          transliteration,
          english_meaning: englishMeaning,
          culture: config.culture
        }
      }
    }).filter(item => Boolean(item.source_text))
  )

  const chineseRecords = Array.isArray(chineseData.chineseProverbs) ? chineseData.chineseProverbs : []
  const cantoneseRecords = Array.isArray(chineseData.cantoneseProverbs) ? chineseData.cantoneseProverbs : []
  const japaneseRecords = Array.isArray(japaneseData.japaneseProverbsData) ? japaneseData.japaneseProverbsData : []
  const koreanRecords = Array.isArray(koreanData.koreanProverbsData) ? koreanData.koreanProverbsData : []

  return {
    records: [
      ...mapProverbEntries(chineseRecords, {
        culture: 'chinese',
        language: 'zh-CN',
        nativeField: 'cn',
        transliterationField: 'py',
        idPrefix: 'zh',
        notes: 'Chinese proverb data parsed from proverbs.js.'
      }),
      ...mapProverbEntries(cantoneseRecords, {
        culture: 'cantonese',
        language: 'zh-HK',
        nativeField: 'cn',
        transliterationField: 'py',
        idPrefix: 'yue',
        notes: 'Cantonese proverb data parsed from proverbs.js.'
      }),
      ...mapProverbEntries(japaneseRecords, {
        culture: 'japanese',
        language: 'ja-JP',
        nativeField: 'jp',
        transliterationField: 'romaji',
        idPrefix: 'ja',
        notes: 'Japanese proverb data parsed from japanese-proverbs.js.'
      }),
      ...mapProverbEntries(koreanRecords, {
        culture: 'korean',
        language: 'ko-KR',
        nativeField: 'kr',
        transliterationField: 'roman',
        idPrefix: 'ko',
        notes: 'Korean proverb data parsed from korean-proverbs.js.'
      })
    ],
    breakdown: {
      chinese: chineseRecords.length,
      cantonese: cantoneseRecords.length,
      japanese: japaneseRecords.length,
      korean: koreanRecords.length
    }
  }
}

function parseLinsaQuotes(repoPath) {
  const readme = readFileSync(join(repoPath, 'readme.md'), 'utf8')
  const lines = readme.split(/\r?\n/)
  const results = []
  let currentTopic = ''
  let quoteIndex = 0

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (/^##\s+/.test(line)) {
      currentTopic = line.replace(/^##\s+/, '').trim()
      continue
    }

    if (!line.startsWith('> ')) {
      continue
    }

    quoteIndex += 1
    const body = line.slice(2).trim()
    const match = body.match(/^(.*?)(?:\s+-\s+([^-][\s\S]*))?$/)
    const quote = normalizeWhitespace(stripMarkdownLinks(match?.[1] || body))
    const author = normalizeWhitespace(match?.[2] || '')

    results.push({
      id: `linsa-quotes:${String(quoteIndex).padStart(4, '0')}`,
      source_text: quote,
      author: author || null,
      tags: currentTopic ? [currentTopic.toLowerCase()] : [],
      extra: {
        repo: 'linsa-quotes',
        topic: currentTopic || null
      }
    })
  }

  return results
}

function toCatalogEntry(sourceKey, record) {
  const meta = REPO_META[sourceKey]
  const sourceText = normalizeWhitespace(stripMarkdownLinks(record.source_text))

  return {
    id: record.id,
    source_text: sourceText,
    source_label: meta.source_label,
    source_url: meta.source_url,
    imported_from: meta.imported_from,
    language: record.language || meta.language,
    notes: record.notes || meta.notes,
    author: record.author || null,
    tags: Array.isArray(record.tags) ? record.tags.filter(Boolean) : [],
    extra: record.extra || {}
  }
}

function buildCatalog() {
  const awesome = parseAwesomeItQuotes(REPO_PATHS.awesome_it_quotes).map(item => toCatalogEntry('awesome_it_quotes', item))
  const proverbData = parseChineseProverbs(REPO_PATHS.chinese_proverbs)
  const proverbs = proverbData.records.map(item => toCatalogEntry('chinese_proverbs', item))
  const linsa = parseLinsaQuotes(REPO_PATHS.linsa_quotes).map(item => toCatalogEntry('linsa_quotes', item))

  const allEntries = uniqueBy(
    [...awesome, ...proverbs, ...linsa],
    entry => normalizeCatalogKey(entry.source_text)
  )

  return {
    generated_at: new Date().toISOString(),
    sources: REPO_META,
    breakdowns: {
      chinese_proverbs: proverbData.breakdown
    },
    counts: {
      awesome_it_quotes: awesome.length,
      chinese_proverbs: proverbs.length,
      linsa_quotes: linsa.length,
      total_before_dedup: awesome.length + proverbs.length + linsa.length,
      total_after_dedup: allEntries.length
    },
    entries: allEntries
  }
}

function main() {
  const outputPath = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_OUTPUT_PATH
  const catalog = buildCatalog()
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')

  console.log(`AI seed catalog built: ${outputPath}`)
  console.log(JSON.stringify(catalog.counts, null, 2))
}

main()
