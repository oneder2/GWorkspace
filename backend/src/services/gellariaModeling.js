import { createHash } from 'node:crypto'
import { Project } from '../models/Project.js'
import { GellariaProjectModel } from '../models/GellariaProjectModel.js'
import { generateStructuredTask } from '../utils/aiProvider.js'

const ARCHETYPES = ['orbital-core', 'stacked-tower', 'bridge-network', 'signal-array', 'archive-engine']
const MATERIALS = ['brass', 'ceramic', 'glass', 'graphite', 'alloy']
const MOTIONS = ['orbit', 'counterspin', 'pulse', 'scan', 'breathe']
const PALETTES = [
  ['#d77a52', '#8ba69d', '#ffd08a'],
  ['#8aa8be', '#d0a86d', '#bfe8f0'],
  ['#a990c2', '#7ca69b', '#dfcbff'],
  ['#d4a95f', '#768baf', '#ffe0a0'],
  ['#7eaa88', '#b68372', '#bff0c7']
]

const clampInteger = (value, min, max, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback
}

const enumValue = (value, allowed, fallback) => allowed.includes(value) ? value : fallback
const colorValue = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : fallback

const projectPayload = (project) => ({
  slug: project.slug,
  name: project.title,
  summary: project.summary,
  role: project.role,
  technologies: project.technologies,
  tags: project.tags,
  involvement: project.involvement,
  featured: project.featured
})

export function projectModelSourceHash(project) {
  return createHash('sha256').update(JSON.stringify(projectPayload(project))).digest('hex')
}

function integerSeed(project) {
  return Number.parseInt(projectModelSourceHash(project).slice(0, 8), 16) % 100000
}

export function createLocalProjectModelSpec(project) {
  const seed = integerSeed(project)
  const text = [project.slug, project.title?.zh, project.title?.en, ...project.technologies, ...project.tags]
    .join(' ').toLowerCase()
  const inferredArchetype = /ai|model|data|research|cite|search/.test(text)
    ? 'signal-array'
    : /mobile|flutter|app|fitness|health/.test(text)
      ? 'orbital-core'
      : /writing|blog|resume|archive|content/.test(text)
        ? 'archive-engine'
        : /api|network|connect|cloud|web/.test(text)
          ? 'bridge-network'
          : ARCHETYPES[seed % ARCHETYPES.length]
  const palette = PALETTES[(seed >>> 3) % PALETTES.length]
  return {
    version: 1,
    seed,
    archetype: inferredArchetype,
    material: MATERIALS[(seed >>> 5) % MATERIALS.length],
    motion: MOTIONS[(seed >>> 7) % MOTIONS.length],
    primary: palette[0],
    secondary: palette[1],
    glow: palette[2],
    complexity: 2 + (seed % 4),
    elements: {
      rings: seed % 4,
      towers: (seed >>> 2) % 5,
      satellites: 2 + ((seed >>> 4) % 5),
      bridges: 1 + ((seed >>> 6) % 4)
    },
    narrative: `${project.title?.zh || project.slug} 的结构取自其技术栈、角色与公开项目描述。`
  }
}

export function normalizeProjectModelSpec(value, project) {
  const fallback = createLocalProjectModelSpec(project)
  const elements = value?.elements || {}
  return {
    version: 1,
    seed: fallback.seed,
    archetype: enumValue(value?.archetype, ARCHETYPES, fallback.archetype),
    material: enumValue(value?.material, MATERIALS, fallback.material),
    motion: enumValue(value?.motion, MOTIONS, fallback.motion),
    primary: colorValue(value?.primary, fallback.primary),
    secondary: colorValue(value?.secondary, fallback.secondary),
    glow: colorValue(value?.glow, fallback.glow),
    complexity: clampInteger(value?.complexity, 2, 5, fallback.complexity),
    elements: {
      rings: clampInteger(elements.rings, 0, 3, fallback.elements.rings),
      towers: clampInteger(elements.towers, 0, 4, fallback.elements.towers),
      satellites: clampInteger(elements.satellites, 2, 6, fallback.elements.satellites),
      bridges: clampInteger(elements.bridges, 1, 4, fallback.elements.bridges)
    },
    narrative: String(value?.narrative || fallback.narrative).replace(/\s+/g, ' ').trim().slice(0, 180)
  }
}

async function generateProjectModel(project) {
  const fallback = createLocalProjectModelSpec(project)
  const result = await generateStructuredTask({
    task: 'Gellaria 项目展品建模',
    payload: projectPayload(project),
    schema: {
      archetype: ARCHETYPES.join('|'),
      material: MATERIALS.join('|'),
      motion: MOTIONS.join('|'),
      primary: '#RRGGBB',
      secondary: '#RRGGBB',
      glow: '#RRGGBB',
      complexity: 'integer 2..5',
      elements: { rings: '0..3', towers: '0..4', satellites: '2..6', bridges: '1..4' },
      narrative: 'string, <= 180 characters'
    },
    fallbackFactory: () => fallback
  })
  return {
    spec: normalizeProjectModelSpec(result.data, project),
    providerMode: result.provider_mode
  }
}

export function projectUsesGellaria(project) {
  return project?.status === 'published' && project.surfaces?.includes('gellaria')
}

export async function refreshProjectWorldModel(projectId, { force = false } = {}) {
  const project = Project.getById(projectId)
  if (!project) throw new Error('Project not found')
  if (!projectUsesGellaria(project)) return null

  const sourceHash = projectModelSourceHash(project)
  const current = GellariaProjectModel.get(projectId)
  if (!force && current?.source_hash === sourceHash) return current

  const job = GellariaProjectModel.createJob(projectId, sourceHash)
  GellariaProjectModel.markRunning(job.id)
  try {
    const generated = await generateProjectModel(project)
    return GellariaProjectModel.complete(job.id, {
      projectId,
      sourceHash,
      spec: generated.spec,
      providerMode: generated.providerMode
    })
  } catch (error) {
    GellariaProjectModel.fail(job.id, error.message)
    throw error
  }
}

export function projectWithWorldModel(project) {
  if (!project) return null
  return {
    ...project,
    world_model: GellariaProjectModel.get(project.id),
    world_model_job: GellariaProjectModel.getLatestJob(project.id)
  }
}

export async function backfillProjectWorldModels({ force = false } = {}) {
  const projects = Project.getAll({ status: 'published', surface: 'gellaria' })
  const results = []
  for (const project of projects) {
    const model = await refreshProjectWorldModel(project.id, { force })
    results.push({ project_id: project.id, slug: project.slug, model })
  }
  return results
}
