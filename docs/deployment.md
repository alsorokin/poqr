# Deployment

## Debian production

Production runs as one self-contained .NET process under systemd, behind Caddy.
Restarting it clears active rooms because room state is in memory.

### Host setup

The server needs a `poqr` runtime user, a restricted `ci-deploy` SSH user,
`/srv/poqr/{incoming,releases}`, and ICU:

```bash
sudo apt update
sudo apt install -y libicu-dev
```

Install `deploy/server/poqr.service`, `poqr-activate`, `poqr-rollback`, and
`ci-deploy.sudoers` as root-owned files. The CI key must be separate from
interactive deployment credentials; the `ci-deploy` key is restricted and
can only run `poqr-activate` through passwordless sudo. Store telemetry
configuration in `/etc/poqr/poqr.env`, owned by `root:root` with mode `0600`;
never commit it.

Point `poqr.snay.am` to the Debian host (do not change the independently hosted
`snay.am` apex record), then install Caddy and
`deploy/server/Caddyfile` at `/etc/caddy/Caddyfile`:

```bash
sudo apt install -y caddy
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy serves the SPA and proxies API and SignalR WebSocket traffic to
`127.0.0.1:8080`. After the `poqr.snay.me` redirect-retention period ends,
remove its DNS record and Caddy site; retain the preceding redirect
configuration for rollback.

### Release and rollback

The `production` GitHub Actions environment needs these secrets:

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | Server hostname or IP address |
| `DEPLOY_HOST_KEY` | Pinned `known_hosts` line for the server |
| `DEPLOY_SSH_PRIVATE_KEY` | Dedicated `ci-deploy` private key |

`.github/workflows/deploy-debian.yml` deploys pushes to `master` (or a manual
workflow run). It packages the app with `deploy/package-release.sh`, uploads
the archive, and activates it. To package and activate a release manually:

```bash
./deploy/package-release.sh <release-id> /tmp/poqr-release-<release-id>
scp /tmp/poqr-release-<release-id>/<release-id>.tar.gz \
  ci-deploy@<host>:/srv/poqr/incoming/<release-id>.tar.gz
ssh ci-deploy@<host> \
  "sudo -n /usr/local/sbin/poqr-activate <release-id>"
```

Activation validates the archive, switches `current`, restarts the service,
and waits for `http://127.0.0.1:8080/api/status`. It automatically restores
the previous release if the new one is unhealthy. To roll back manually:

```bash
sudo /usr/local/sbin/poqr-rollback
```

## Azure recovery

Azure resources are defined by Bicep in `infra/`. The manual infrastructure
deployment command is:

```bash
az deployment sub create \
  --name poqr-infra \
  --location westeurope \
  --template-file infra/main.bicep
```

`.github/workflows/master_poqr.yml` is manual-only and retained as a recovery
deployment. It uses OIDC secrets referenced in the workflow's `env` block; the
service principal needs Contributor at subscription scope. The workflow
deploys infrastructure and builds/deploys the application to App Service.
