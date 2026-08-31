# GWorkspace public facts v1

GWorkspace is the authority for public profile, project, experience, article,
and media facts. Consumers must use the versioned HTTP representation; they
must not read the GWorkspace SQLite database or treat a local copy as editable
source data.

## Endpoint and version negotiation

Fetch `GET https://workspace.gellaronline.cc/api/v1/public-facts`. The response
uses contract version `1.0.0` and includes `X-Public-Facts-Version: 1.0.0`.
Consumers may request a supported major version with either `?version=1` or
`X-Public-Facts-Version: 1`. GWorkspace returns `406` and
`UNSUPPORTED_PUBLIC_FACTS_VERSION` for any unknown or malformed requested
major version.

The provider schema and fixtures are mirrored under:

- `backend/contracts/gworkspace/public-facts/v1/`
- `backend/fixtures/gworkspace/public-facts/v1/`

These files are byte-identical tested copies of the frozen ecosystem registry
artifacts. The registry remains the contract review authority.

## Consumer validation

Validate every fetched payload with a JSON Schema Draft 2020-12 validator
against `schema.json`, then perform the contract's supplemental checks:

1. Reject a `schema_version` whose major version is unsupported.
2. Require IDs to be unique within each root collection.
3. Require project and article slugs to be unique within their collection.
4. Resolve `profile.avatar_media_id` and every `media_ids` item against the
   root `media` collection.
5. Reject the complete payload if any check fails. Do not partially import it.

The provider duplicates the one authoritative article text into both locale
slots when a blog has no separate translation. This is locale fallback, not a
claim that an independently translated version exists.

## Cache and refresh policy

Honor `Cache-Control`, `ETag`, and `Last-Modified` response headers. Revalidate
after the advertised freshness lifetime and use conditional requests when the
HTTP client supports them. A persisted record or generated snapshot must carry
at least this provenance next to the cached data:

```json
{
  "source": "GWorkspace",
  "source_id": "project:opaque-provider-id",
  "contract_version": "1.0.0",
  "fetched_at": "2026-08-31T12:00:00Z"
}
```

A consumer may use a last-known validated snapshot during an outage only when
it is labeled as generated fallback data with its source version, source update
time, and fetch/generation time. A synthetic fixture must be labeled synthetic.
Neither kind of fallback may be edited and promoted as authoritative content.

On malformed data, unsupported versions, or a failed refresh, keep the previous
validated snapshot if the consumer's product policy allows it and expose/log its
staleness. Otherwise fail closed. Never fall back to direct database access.

## Provider filtering and ordering

Only `published` project, experience, article, and media rows are serialized.
Draft writing, accounts, sessions, credentials, comments, likes, guestbook
entries, clients, relationships, tasks, private media, and local filesystem
paths are outside this endpoint.

Collections are ordered by the provider's explicit sort order and then stable
public ID. Consumers may apply presentation sorting, but must not infer identity
or meaning from array positions or database row numbers.

## Legacy resume migration inventory

`oneder2.github.io/data/resume.yaml` remains read-only migration input for a
later task. It currently contains facts that should be reviewed and migrated
into GWorkspace before that consumer changes authority:

- bilingual display/full name, headline, location, and summary;
- email, GitHub, and LinkedIn contacts;
- Programming, Web & Platform, and Digital Art skill groups;
- an avatar reference that must become a public media record rather than retain
  the resume repository's local asset path;
- empty experience and education collections;
- projects `gworkspace`, `vana`, `citeai`, `surfsmart`, `twilight-zone`, and
  `personal-resume`, including dates, technologies, links, featured state, and
  contributor involvement where present.

This inventory does not import, modify, or delete the legacy YAML. Conflicts
must be resolved in GWorkspace during a separately authorized migration.
