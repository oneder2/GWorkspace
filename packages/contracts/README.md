# Shared public contracts

This package exposes compatibility copies of GWorkspace's public API schemas to
monorepo consumers such as Gellaria. The GWorkspace backend remains the provider
and authority for the serialized data.

- Resume v1 schema: `resume/v1/schema.json`
- Public facts v1 schema: `gworkspace/public-facts/v1/schema.json`
- Provider fixtures: `backend/fixtures/`
- Transport documentation: `docs/resume-api-v1.md` and `docs/public-facts-v1.md`

The public-facts v1 schema and fixtures are frozen. Mirroring the schemas in this
workspace package does not change their hashes or API meaning.
