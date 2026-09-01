# Production layout

The current deployment uses these paths on the `Nerdrassil` SSH host:

```text
/home/deploy/apps/gellaria/current -> releases/<commit>
/home/deploy/apps/gellaria/shared/data/gellaria.db
/etc/systemd/system/gellaria.service
/etc/nginx/sites-enabled/gellaria
```

The service listens only behind Nginx on port `4420`. HTTPS is issued and renewed by Certbot for `gellaria.64-83-15-226.nip.io`.

For a release, upload the monorepo root to a new directory under `releases`, run
`npm ci` and `npm run build:gellaria`, then atomically repoint `current` and
restart `gellaria.service`. The SQLite directory is shared between releases and
must not be deleted during cleanup.

The repository workflow also publishes `ghcr.io/oneder2/gellaria:latest` after all quality checks pass.

The target shared-domain topology is documented in
`docs/gellaria/GWORKSPACE_INTEGRATION.md`. The current nip.io server block remains useful
for staging; production should use `deploy/gellaria/nginx-unified.conf` after the Vue
frontend has been published to the path declared there.
