#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { getDatabase } from '../src/config/database.js'
import { closeDatabase } from '../src/config/database.js'
import { runMigrations } from '../src/config/migrations.js'
import { AiSeed } from '../src/models/AiSeed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DEFAULT_CATALOG_PATH = resolve(__dirname, '../src/utils/aiSeedCatalog.json')
const CATALOG_IMPORT_PREFIX = 'catalog:'

const normalizeWhitespace = (value) => String(value || '').replace(/\s+/g, ' ').trim()
const normalizeDomain = (value) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }

  try {
    const url = value.includes('://') ? new URL(value) : new URL(`https://${value}`)
    return url.hostname.replace(/^www\./, '').toLowerCase()
  } catch (error) {
    return null
  }
}
const isCatalogImported = (value) => typeof value === 'string' && value.startsWith(CATALOG_IMPORT_PREFIX)

const serializeNotes = (entry) => JSON.stringify({
  author: entry.author || null,
  tags: Array.isArray(entry.tags) ? entry.tags : [],
  extra: entry.extra || {}
})

function findExistingSeedBySourceText(sourceText) {
  const db = getDatabase()
  return db.prepare('SELECT * FROM ai_seeds WHERE source_text = ?').get(sourceText) || null
}

function syncMissingCatalogEntries(validSourceTexts) {
  const db = getDatabase()
  const staleRows = db.prepare(`
    SELECT id
    FROM ai_seeds
    WHERE imported_from LIKE ?
      AND source_text NOT IN (${validSourceTexts.map(() => '?').join(', ')})
  `).all(`${CATALOG_IMPORT_PREFIX}%`, ...validSourceTexts)

  if (staleRows.length === 0) {
    return 0
  }

  const now = new Date().toISOString()
  const updateStatement = db.prepare(`
    UPDATE ai_seeds
    SET status = 'archived', updated_at = ?
    WHERE id = ?
  `)
  const updateMany = db.transaction((rows) => {
    rows.forEach((row) => updateStatement.run(now, row.id))
  })

  updateMany(staleRows)
  return staleRows.length
}

function loadCatalog(catalogPath) {
  if (!existsSync(catalogPath)) {
    throw new Error(`Catalog file not found: ${catalogPath}`)
  }

  const raw = readFileSync(catalogPath, 'utf8')
  const parsed = JSON.parse(raw)

  if (!Array.isArray(parsed.entries)) {
    throw new Error('Catalog entries must be an array')
  }

  return parsed
}

function importCatalog(catalog) {
  let created = 0
  let updated = 0
  let archived = 0
  let skipped = 0
  const validSourceTexts = []

  for (const entry of catalog.entries) {
    const sourceText = normalizeWhitespace(entry.source_text)
    if (!sourceText) {
      skipped += 1
      continue
    }

    validSourceTexts.push(sourceText)

    const notes = serializeNotes(entry)
    const existing = findExistingSeedBySourceText(sourceText)

    if (existing) {
      if (!isCatalogImported(existing.imported_from)) {
        skipped += 1
        continue
      }

      const shouldUpdate = (
        existing.source_label !== entry.source_label ||
        (existing.source_url || null) !== (entry.source_url || null) ||
        (existing.language || null) !== (entry.language || 'zh-CN') ||
        (existing.imported_from || null) !== (entry.imported_from || 'catalog') ||
        (existing.notes || null) !== notes ||
        existing.status !== 'active'
      )

      if (shouldUpdate) {
        const db = getDatabase()
        db.prepare(`
          UPDATE ai_seeds
          SET
            source_label = ?,
            source_url = ?,
            source_domain = ?,
            language = ?,
            status = 'active',
            imported_from = ?,
            notes = ?,
            updated_at = ?
          WHERE id = ?
        `).run(
          entry.source_label,
          entry.source_url || null,
          normalizeDomain(entry.source_url || null),
          entry.language || 'zh-CN',
          entry.imported_from || 'catalog',
          notes,
          new Date().toISOString(),
          existing.id
        )
        updated += 1
      } else {
        skipped += 1
      }
      continue
    }

    AiSeed.create({
      source_text: sourceText,
      source_label: entry.source_label,
      source_url: entry.source_url,
      language: entry.language || 'zh-CN',
      status: 'active',
      imported_from: entry.imported_from || 'catalog',
      notes
    })
    created += 1
  }

  if (validSourceTexts.length > 0) {
    archived = syncMissingCatalogEntries(validSourceTexts)
  }

  return { created, updated, archived, skipped, summary: AiSeed.getSummary() }
}

function main() {
  const catalogPath = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_CATALOG_PATH
  runMigrations()
  const catalog = loadCatalog(catalogPath)
  const result = importCatalog(catalog)

  console.log(`AI seed catalog imported from: ${catalogPath}`)
  console.log(JSON.stringify(result, null, 2))
}

try {
  main()
} catch (error) {
  console.error('Failed to import AI seed catalog:', error)
  process.exitCode = 1
} finally {
  closeDatabase()
}
