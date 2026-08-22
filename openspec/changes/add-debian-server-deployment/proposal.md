## Why

Poqr currently deploys automatically to Azure App Service, while a freshly provisioned Debian server is available for a simpler, operator-controlled deployment path. The project needs repeatable local and continuous deployment procedures that preserve HTTPS, SignalR WebSocket support, and safe rollback without changing product behavior.

## What Changes

- Add a single-instance Debian server deployment path using a dedicated runtime service, Caddy reverse proxy, TLS, and versioned releases.
- Add local and GitHub Actions deployment procedures that use separate SSH identities for administration and CI.
- Change production CORS configuration to allow both the existing Azure hostname and temporary public hostname `poqr.snay.me`.
- Continue sending telemetry to the existing Application Insights resource when its connection string is supplied on the server.
- Make Azure deployment automation manual-only while retaining the Bicep infrastructure and a reversible Azure deployment path.
- Document server bootstrap, deployment, rollback, and operational validation.

## Capabilities

### New Capabilities

- `debian-server-deployment`: Deploy the single-instance Poqr application to a Debian server over SSH with HTTPS, WebSocket proxying, health verification, and rollback.

### Modified Capabilities

- None.

## Impact

- **Backend:** production CORS configuration and Application Insights environment configuration.
- **Infrastructure:** new Debian host setup and service/reverse-proxy configuration; Azure Bicep remains available but is not automatically applied on pushes.
- **Automation:** GitHub Actions workflow changes and new CI SSH deployment credentials.
- **Documentation:** README and agent/deployment guidance.
- **Frontend/shared contracts:** no expected changes.

**Non-goals:** add persistence, authentication, multi-instance deployment, a SignalR backplane, or a domain failover mechanism.
