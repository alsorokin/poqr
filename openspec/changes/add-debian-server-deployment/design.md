## Context

See proposal.md for motivation and `specs/debian-server-deployment/spec.md` for the externally observable deployment contract. The current GitHub Actions workflow publishes a self-contained `linux-x64` backend and copies the Angular build into `wwwroot`, then automatically deploys it to Azure App Service. The backend uses port `8080` outside development, exposes `/api/status`, serves the SPA and hub from the same process, and currently trusts only the Azure public origin for CORS.

The target is one Debian trixie server. Its user-managed `deploy` SSH account remains an interactive, passphrase-protected administration account. No server credentials will be committed to the repository.

## Goals / Non-Goals

**Goals:**

- Create an operator-controlled, single-instance deployment path that preserves the package shape already used by Azure.
- Terminate TLS and proxy SignalR WebSockets at the server edge.
- Make releases atomic enough to retain a working previous release after a failure.
- Support both local deployment and push-triggered GitHub Actions deployment with distinct SSH identities.
- Preserve the Azure Bicep deployment as a manual recovery option while preventing automatic Azure deployments on pushes.

**Non-Goals:**

- Container orchestration, Docker, a database, persistence, authentication, horizontal scaling, a SignalR backplane, blue/green deployment, or zero-downtime process replacement.
- Changing poker rules, HTTP routes, SignalR hub methods/events, C# records, or TypeScript types.
- Configuring TLS before the selected domain resolves to the server.

## Decisions

### Run the published application as a systemd service

Create a dedicated unprivileged `poqr` runtime user and a `poqr.service` unit. It runs the already self-contained application from `/srv/poqr/current`, binds only to loopback port `8080`, sets `ASPNETCORE_ENVIRONMENT=Production`, and receives the Application Insights connection string through a root-readable environment file.

This keeps the runtime separate from the interactive `deploy` and CI identities, uses the project’s existing self-contained package, and gives service supervision and journal logging without introducing a container runtime.

Alternatives considered:

- Docker Compose: workable, but adds container/image lifecycle and privileged Docker access without a current need.
- Running directly as `deploy`: makes an administrative SSH account the application security boundary.

### Use Caddy as the public reverse proxy

Caddy listens on ports 80 and 443, manages the certificate for the selected public hostname after DNS resolution, redirects HTTP to HTTPS, and reverse-proxies requests to `127.0.0.1:8080`. Its proxy configuration must preserve WebSocket upgrades for SignalR.

Caddy has an intentionally small operational surface for a single hostname and automatic certificate renewal. Nginx plus Certbot is a viable alternative but requires separately managing certificate issuance and renewal.

### Use versioned release directories and an activation script

Local and CI deployment both produce the same self-contained backend plus Angular `wwwroot` artifact. The server stores it beneath `/srv/poqr/releases/<immutable-release-id>/`. A deployment script validates ownership and archive contents, switches the `/srv/poqr/current` symlink, restarts `poqr.service`, and checks `/api/status` through the local service (and, after proxy setup, the public hostname).

The script retains the previous symlink target until health validation succeeds. On a failed restart or health check, it restores that target, restarts the service, and returns a nonzero status. A separate rollback command selects the last healthy release without rebuilding.

This is not zero downtime: service restart briefly interrupts clients. Because rooms are intentionally in-memory, any restart clears rooms; deploys must state this operational consequence before activation.

### Separate interactive and CI SSH accounts

Keep `deploy` for human administration with its existing passphrase-protected local private key. Create a `ci-deploy` account and a separate no-passphrase key pair for GitHub Actions. Place only the CI private key, server hostname, and pinned host key in GitHub secrets; install only its public key on the server.

The CI account owns or is granted narrowly scoped access to upload releases and invoke the deployment script. Its sudo authorization, if required, is restricted to the named service-management/deployment commands rather than unrestricted sudo. GitHub Actions accesses no interactive administrator key or passphrase.

An unencrypted CI key is appropriate only because its private half is stored as a protected GitHub secret and the public half is limited to deployment operations. Environment protection, branch protection for `master`, and GitHub Actions secret masking reduce exposure.

### Keep Application Insights as an external telemetry destination

The existing Application Insights SDK remains in the application. The server supplies `APPLICATIONINSIGHTS_CONNECTION_STRING` from its protected service environment file, allowing telemetry to continue reaching the Azure-hosted resource over outbound HTTPS. Missing configuration must not prevent the application from starting.

### Make Azure deployment manual-only

Retain the Bicep modules and Azure credentials configuration, but remove the automatic push path from the Azure workflow. Keep `workflow_dispatch` available for deliberate Azure deployment. The new server deployment workflow is responsible for build, test, artifact packaging, SSH upload, activation, and health validation on pushes to `master`.

### Expand the fixed production CORS allow-list

Add `https://poqr.snay.am` alongside `https://poqr.azurewebsites.net` to the production policy while retaining credentials support. The standard Debian deployment is same-origin, so CORS is normally not evaluated; the explicit list preserves compatibility during the transition.

No REST routes, SignalR hub methods/events, C# records, or TypeScript types change. RoomStore remains the authoritative owner of in-memory room state.

## Risks / Trade-offs

- [The DNS record is unavailable or incorrect] → Do not install/activate the public TLS configuration until `poqr.snay.am` resolves to the server; retain Azure while waiting and use the existing `snay.me` domain only after an explicit choice.
- [A deployment restarts the sole in-memory instance] → Communicate that active rooms are cleared; schedule deploys for low usage and validate health before declaring success.
- [CI SSH key disclosure] → Use a dedicated account/key, restrictive authorized-key and sudo policy, GitHub environment protection, and immediate key rotation/revocation procedures.
- [A bad release becomes active] → Validate locally and through Caddy after restart; retain the prior release and rollback automatically on health-check failure.
- [Unattended upgrades restart services] → Monitor systemd/Caddy logs and treat server reboot/restart as an in-memory-room reset.
- [Application Insights configuration leaks] → Store the connection string only in the server environment file and GitHub secret store, never in repository files or deployment logs.

## Migration Plan

1. Preserve the current Azure deployment and Bicep resources while the Debian server is prepared.
2. Create the service users, restricted CI identity, release directories, systemd unit, Caddy configuration, and deployment scripts; do not expose the application publicly until domain DNS and certificate issuance succeed.
3. Add the CORS origin and configuration required by the Debian service, then build and deploy a release manually from the workstation.
4. Verify HTTPS, `/api/status`, two-browser SignalR behavior, reconnect behavior, logs, and Application Insights telemetry.
5. Change Azure automation to manual-only and enable the SSH deployment workflow for `master`.
6. Roll back by switching to the previous release and restarting the service. If server deployment must be abandoned, use the retained manual Azure workflow to publish the existing package shape.

## Open Questions

- Confirm `poqr.snay.am` DNS approval and point its A/AAAA records before the TLS/Caddy activation step; select `snay.me` explicitly only if the preferred domain cannot be used.
