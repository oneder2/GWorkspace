# Gellaria semantic modeling

Gellaria models public content through constrained data recipes. Generated
records describe geometry parameters only; they never contain JavaScript,
shader source, file paths, or executable code.

## Project workflow

Publishing a project with the `gellaria` surface through the GWorkspace admin
API automatically runs the project-modeling workflow:

1. Hash the public project name, summary, role, technologies, tags, and flags.
2. Reuse the existing model when that source hash has not changed.
3. Persist a `queued` and then `running` job in `gellaria_model_jobs`.
4. Ask the configured AI provider for a version 1 model recipe.
5. Normalize every field against the finite model vocabulary and numeric limits.
6. Fall back to a stable local recipe when no provider is configured or the
   provider fails.
7. Store the completed recipe in `gellaria_project_models` and expose it only
   through the public world response.

The admin `3D models` tab displays the current revision and recent job states.
It can explicitly regenerate a model with
`POST /api/admin/content/projects/:id/world-model`.

Existing projects can be backfilled once after a migration:

```bash
cd backend
npm run gellaria:backfill-models
```

Pass `-- --force` only when every existing model should receive a new revision.

## Model specification v1

```json
{
  "version": 1,
  "seed": 48152,
  "archetype": "signal-array",
  "material": "alloy",
  "motion": "scan",
  "primary": "#8aa8be",
  "secondary": "#d0a86d",
  "glow": "#bfe8f0",
  "complexity": 4,
  "elements": {
    "rings": 2,
    "towers": 3,
    "satellites": 5,
    "bridges": 2
  },
  "narrative": "The visual rationale for this project artifact."
}
```

Allowed archetypes are `orbital-core`, `stacked-tower`, `bridge-network`,
`signal-array`, and `archive-engine`. The renderer owns their implementation,
scale, material safety, and animation limits.

## Content presentation

The optional public-world `presentation` field preserves content meaning:

| Presentation | Content | Spatial behavior |
| --- | --- | --- |
| `project-model` | Published project | Dedicated generated machine on a workshop bench |
| `blog-constellation` | Blog post | Stable, post-specific constellation |
| `daily-signal` | Daily capsule | Temporary illuminated page and scanning light |
| `echo-fragment` | Guestbook or text fragment | Unlabelled floating seed revealed by proximity |
| `audio-echo` | Listening activity | Rotating sound disc and concentric grooves |
| `signal` | Other external record | Generic receiving instrument |

Older clients may ignore `presentation`, `modelSpec`, and `modelRevision`.
Gellaria derives a stable local model whenever a project does not yet have a
stored recipe, so publishing remains available during provider outages.
