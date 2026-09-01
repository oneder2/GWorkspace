# GWorkspace integration

Gellaria is GWorkspace's optional spatial exhibition mode. It is a separate
build and failure boundary, but it is not a second public site and does not own
canonical content routes.

## Route ownership

| Path | Owner | Purpose |
| --- | --- | --- |
| `/`, `/blog`, `/portfolio`, `/workspace`, `/admin` | GWorkspace / Vue static build | Canonical public pages, tools and administration |
| `/explore` | Gellaria / Next.js on `4420` | Spatial exhibition mode |
| `/api/*` | GWorkspace / Express on `3001` | Canonical content, identity and operations |
| `/ws/gellaria` | Gellaria / WebSocket on `4420` | Presence, signals and visitor influence |

The current deployment keeps GWorkspace on Vercel and serves Gellaria from
`https://gellaria.64-83-15-226.nip.io/explore`. The Vue navigation uses
`VITE_GELLARIA_URL` when configured and falls back to that public address in
production. This keeps the applications independently deployable while Gellaria
continues to act as an optional GWorkspace view.

`deploy/gellaria/nginx-unified.conf` is the reference for a future same-origin
deployment. Keep the exact WebSocket location before the `/api/` and `/`
locations if that topology is adopted.

## Release order

In the current public deployment, `GWORKSPACE_API_URL` points to
`https://workspace.gellaronline.cc`, while `GWORKSPACE_PUBLIC_URL` points to
`https://www.gellaronline.cc` for public image fallback. The two origins are
intentionally separate.

1. Deploy the GWorkspace backend and run migrations through `010_writing_studio.sql`.
2. Verify `GET /api/public/world?locale=zh` and `GET /api/public/projects`.
3. Verify `GET /api/public/v1/resume?locale=zh&surface=gellaria`; this versioned response is the authority for archive identity, skills, timeline, and enhanced project facts.
4. Build and publish the Vue app through Vercel.
5. Build Gellaria with `NEXT_PUBLIC_SITE_URL=https://gellaria.64-83-15-226.nip.io` and `NEXT_PUBLIC_GWORKSPACE_URL=https://www.gellaronline.cc`.
6. Run Gellaria with `GWORKSPACE_API_URL=http://127.0.0.1:3001`.
7. Install `deploy/gellaria/nginx-gellaria.conf`, validate with `nginx -t`, then reload.

During local development, open Gellaria at `http://127.0.0.1:3000/explore`.
The Vue app can point its Explore navigation item there with
`VITE_GELLARIA_URL`.

Gellaria keeps bundled content as a runtime fallback. A backend outage therefore
does not make the world blank, but fresh blogs, projects and profile changes will
remain unavailable until the API recovers.

## Acceptance checks

```bash
curl -fsS https://workspace.gellaronline.cc/api/public/world?locale=zh
curl -fsS https://workspace.gellaronline.cc/health
curl -I https://gellaria.64-83-15-226.nip.io/explore
curl -I https://www.gellaronline.cc/blog
curl -I https://www.gellaronline.cc/portfolio
```

Open two browser sessions at `/explore` and confirm that both travelers appear.
Enter every exhibition hall with `E`, activate an exhibit, and verify that its
canonical action returns to the matching GWorkspace page.

The feature-level public/private mapping is tracked in
`GWORKSPACE_FEATURE_MAPPING.md`.
