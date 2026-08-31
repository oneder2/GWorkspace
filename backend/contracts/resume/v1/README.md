# Public Resume Contract v1

Schema: `schema.json`
Version: `1.0.0`
Provider: GWorkspace
Route: `GET /api/public/v1/resume`

This contract is additive to the frozen GWorkspace public-facts v1 contract and
does not change that contract's schema or fixtures. It provides the
resume-specific profile, contacts, skills, experience, education, project, and
rendering-setting projection requested by the resume consumer.

The transport is not a display surface. Records are serialized only when
`status` is `published` and `surfaces` contains the requested surface. The
default is `resume_web`; `resume_pdf`, `portfolio`, and `gellaria` are also valid
surface values.

Omitting `locale` returns bilingual `{ "zh", "en" }` values. `locale=zh` and
`locale=en` collapse all localized values to strings or localized arrays to a
single array. Both forms validate against the same schema.

Stable IDs are opaque provider IDs. Dates preserve source precision as `YYYY`
or `YYYY-MM`. Media and link URLs are absolute. Nullable fields use JSON null,
and consumers must tolerate empty arrays.

See `../../../fixtures/resume/v1/response.bilingual.json` for a synthetic
validated response and `../../../../docs/resume-api-v1.md` for transport,
caching, error, import, and consumer guidance.
