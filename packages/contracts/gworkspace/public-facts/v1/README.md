# GWorkspace public facts v1

- Status: frozen draft
- Contract version: `1.0.0`
- Provider: GWorkspace
- Consumers: oneder2.github.io, Gellaria, Fiverr
- Privacy class: public only
- Frozen: 2026-08-31

This draft freezes the input used by GW-001. GWorkspace owns every fact serialized by this contract. Consumer copies are validated caches or projections and cannot be edited as authorities.

## Semantics

- `profile`, `projects`, `experiences`, `articles`, and `media` are the complete v1 public fact classes.
- Every shared record uses a provider-issued opaque ID and `visibility: public`.
- All references in `avatar_media_id` and `media_ids` must resolve to a record in the root `media` array. JSON Schema validation is supplemented by this referential-integrity check.
- IDs must be unique within their collection. Project and article slugs must be unique within their collection.
- Provider ordering is deterministic: explicit product order first, then ID as a stable tie-breaker. Consumers must not infer meaning from array position.
- All URLs are absolute public URLs. Local paths, signed private URLs, credentials, drafts, account records, comments, relationship data, client data, and personal tasks are forbidden.
- Consumers reject unsupported major versions. Compatible additions require a minor release; clarifications and fixture corrections require a patch release.

## Frozen fixtures

- `fixtures/gworkspace/public-facts/v1/minimal.valid.json`
- `fixtures/gworkspace/public-facts/v1/representative.valid.json`
- `fixtures/gworkspace/public-facts/v1/version.invalid.json`
- `fixtures/gworkspace/public-facts/v1/visibility.invalid.json`
- `fixtures/gworkspace/public-facts/v1/dangling-media.invalid.json`

Changing this schema or the frozen fixtures requires an explicit unfreeze decision or a new contract version. GW-001 may implement serializers, validators, and compatibility adapters against it without changing its meaning.
