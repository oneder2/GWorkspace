# GWorkspace Resume API v1

GWorkspace is the authority for public profile, contact, skill, experience,
education, and project facts. The resume site is a read-only projection. It
must not read the GWorkspace SQLite database or treat a local copy as editable
source data.

## Endpoint

```http
GET /api/public/v1/resume
GET /api/public/v1/resume?locale=zh
GET /api/public/v1/resume?locale=en
GET /api/public/v1/resume?surface=resume_pdf
```

`surface` defaults to `resume_web`. Accepted values are `portfolio`,
`resume_web`, `resume_pdf`, and `gellaria`. The API is a transport and is not a
surface itself.

When `locale` is omitted, localized values are objects with `zh` and `en`
members. With `locale=zh` or `locale=en`, every localized value, including PDF
filenames and highlight lists, is collapsed to the requested language.

## Publication Rules

A record is returned only when both conditions are true:

1. `status` is `published`.
2. `surfaces` contains the requested `surface`.

`status` controls whether a record is public. `surfaces` controls which public
projection may display it. Consumers must not infer publication from a nonempty
surface list, and must not use API route names as surface values.

The profile must itself pass both checks. Otherwise the endpoint returns `404`
with `RESUME_NOT_PUBLISHED`. Child arrays are filtered independently.

## Response Contract

The JSON Schema is
`backend/contracts/resume/v1/schema.json`. A validated synthetic response is
`backend/fixtures/resume/v1/response.bilingual.json`.

Top-level fields:

| Field | Meaning |
| --- | --- |
| `schema_version` | Exact contract version, currently `1.0.0`. |
| `generated_at` | UTC response generation time. |
| `source` | GWorkspace provenance, canonical endpoint, and newest fact update time. |
| `locale` | `null`, `zh`, or `en`. |
| `surface` | Surface used for all publication filtering. |
| `profile` | Identity, avatar, contacts, publication metadata. |
| `skills` | Ordered published skill groups. |
| `experience` | Ordered published experience records. |
| `education` | Ordered published education records. |
| `projects` | Ordered published projects. |
| `settings` | Consumer rendering settings, currently default language and PDF settings. |

Every public record has an opaque string `id`, `status`, `surfaces`, and
`updated_at`. Consumers must not derive database table names or numeric row IDs
from these IDs.

Project fields are `id`, `slug`, localized `name` and `summary`, nullable
localized `role`, `involvement`, `start`, nullable `end`, `technologies`,
localized `highlights`, `links`, nullable `cover`, `gallery`, `featured`,
`status`, `surfaces`, and `updated_at`. Date precision is either `YYYY` or
`YYYY-MM`; consumers must preserve the supplied precision and must not invent a
day.

Media URLs and project links are absolute in public responses. Nullable fields
remain `null`, not empty strings. Empty collections remain arrays or objects as
declared by the schema.

Example excerpt:

```json
{
  "schema_version": "1.0.0",
  "locale": "zh",
  "surface": "resume_web",
  "profile": {
    "id": "profile:owner",
    "name": "示例站长",
    "status": "published",
    "surfaces": ["portfolio", "resume_web", "resume_pdf", "gellaria"]
  },
  "skills": [],
  "experience": [],
  "education": [],
  "projects": []
}
```

## HTTP Behavior

Successful responses include:

```text
Cache-Control: public, max-age=300, stale-while-revalidate=900
X-Resume-Schema-Version: 1.0.0
Last-Modified: <newest included fact timestamp>
Access-Control-Allow-Origin: https://resume.gellaronline.cc
```

The configured resume origin is allowed by CORS. Other production origins must
be explicitly allowlisted; credentials are not enabled for this public route.

Errors use a stable `error` code and a human-readable `message`:

| HTTP | Code | Meaning |
| --- | --- | --- |
| `400` | `INVALID_RESUME_LOCALE` | `locale` is not `zh` or `en`. |
| `400` | `INVALID_RESUME_SURFACE` | `surface` is not in the surface enum. |
| `404` | `RESUME_NOT_PUBLISHED` | Profile is not published on the requested surface. |
| `500` | `RESUME_RESPONSE_FAILED` | Provider could not build a schema-valid response. |

All errors use `Cache-Control: no-store`.

## Consumer Rules

The resume site should fetch and validate a pinned major-version response at
build time, then record `source.canonical_url`, `schema_version`,
`source.updated_at`, and its own fetch time with any generated cache. Reject an
unsupported major version and malformed payload instead of rendering partial
facts.

Use `surface=resume_web` for the web build and `surface=resume_pdf` for PDF
generation. Apply `settings.pdf.project_limit` only after using the project
order returned by the provider. Do not merge in records from another surface.

A last-known-good fallback is allowed only when it records GWorkspace
provenance and is clearly a generated cache. It must never become an editable
second source. The legacy `resume.yaml` remains a migration validation source
until downstream migration is reviewed; it is not deleted by this change.

## Import

From `backend/`:

```bash
npm run import:resume -- \
  --source ../../oneder2.github.io/data/resume.yaml \
  --schema ../../oneder2.github.io/schema/resume.schema.json
```

The importer validates the source schema and duplicate IDs, hashes the source,
and records the hash in `resume_imports`. Repeating the same import is a no-op.
`--force` is reserved for an explicit reviewed re-import. Legacy visibility
`web` and `pdf` map to `resume_web` and `resume_pdf`; legacy `api` is ignored.
Imported projects additionally receive `portfolio` and `gellaria` so existing
public projections remain available.
