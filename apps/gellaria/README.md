# Gellaria

Gellaria is GWorkspace's multiplayer spatial exhibition mode. Visitors explore
three expandable halls, encounter real projects and writing as 3D exhibits, and
leave light ecological signals for future visitors.

Live deployment: [gellaria.64-83-15-226.nip.io](https://gellaria.64-83-15-226.nip.io)

## Run locally

```bash
npm install
npm run dev:gellaria
```

The custom server hosts both Next.js and the WebSocket room. If port 3000 is occupied:

```bash
PORT=3010 npm run dev:gellaria
```

## Content

Set `GWORKSPACE_API_URL` to the GWorkspace backend origin. Gellaria reads the
public profile, projects, recent blogs, and guestbook echoes from
`/api/public/world`. Gellaria turns those records into spatial exhibits; full
reading and formal project pages remain in GWorkspace.

The versioned `/api/public/v1/resume?locale=zh&surface=gellaria` endpoint is the
authority for identity context and enhanced project facts.
Set `GWORKSPACE_PUBLIC_URL` to the public origin that owns `/images/`; Gellaria
proxies only that image namespace so archive media remains same-origin.

Gellaria also reads GWorkspace's public daily capsule and Spotify now-playing
endpoint. The capsule appears in the observatory, an available track becomes a
grove echo, and the study room links into the public/private writing studio at
`/workspace`. Private writing projects and browser-local work logs are never
copied into the public world.

`lib/content.ts` remains the spatial definition and outage fallback. Edit it for
positions, colors, visitor actions, artifacts, and bundled fallback exhibits.

Each landmark also owns an `exhibits` collection. These entries appear in both the in-world landmark panel and the two-dimensional archive. `influenceColors` maps the landmark's three visitor tags to scene colors, while `influenceDescription` explains the corresponding physical response.

Persistent signals and tags are projected into four response tiers: dormant at 0 actions, faint at 1–4, resonant at 5–14, and altered at 15 or more. The projection lives in `lib/influence.ts`; UI and 3D models consume the same result.

## Persistence

Signals are stored in SQLite. Set `DATABASE_PATH` to a persistent volume in production. A visitor can affect the same landmark once every 30 seconds; the server validates landmark IDs and player boundaries before writing.

## Production

```bash
npm run build:gellaria
NODE_ENV=production PORT=3000 npm run start --workspace @gworkspace/gellaria
```

Run these commands from the monorepo root. For Docker, use
`docker compose -f apps/gellaria/docker-compose.yml up --build`; the host must
support WebSocket upgrades and a persistent volume mounted at `/data`.

Health check: `GET /api/health`

The target shared-domain route ownership and release order are documented in
`docs/gellaria/GWORKSPACE_INTEGRATION.md`.

Gellaria is served under `/explore`; `/ws/gellaria` is its only shared-origin
realtime route. The current production host runs the versioned release through
`deploy/gellaria/gellaria.service` on port 4420. Nginx uses
`deploy/gellaria/nginx-gellaria.conf` as its bootstrap configuration; Certbot
adds the managed TLS blocks on the host. Application data lives outside
releases at `/home/deploy/apps/gellaria/shared/data`.

## Quality checks

```bash
npm run typecheck:gellaria
npm run lint:gellaria
npm run test:gellaria
npm run build:gellaria
```
