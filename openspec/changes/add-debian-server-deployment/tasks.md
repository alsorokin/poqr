## 1. Server access and runtime foundation

- [x] 1.1 Create the unprivileged `poqr` runtime user, `ci-deploy` deployment user, release directory ownership, and narrowly scoped service-management permissions; verify `ci-deploy` cannot open an interactive administrator shell or use unrestricted sudo.
- [x] 1.2 Generate a dedicated no-passphrase CI SSH key pair, install only its public key for `ci-deploy`, and store the private key outside the repository; verify the key authenticates independently of the passphrase-protected `deploy` key.
- [x] 1.3 Add the `poqr.service` systemd unit and protected production environment file, binding the application only to loopback port 8080; verify `systemctl status poqr` and `curl http://127.0.0.1:8080/api/status` succeed for a deployed release.
- [x] 1.4 Install and configure Caddy to redirect HTTP to HTTPS and proxy the SPA, API, and `/hubs/poker` WebSocket endpoint; after `poqr.snay.me` DNS resolves, verify certificate issuance, HTTPS redirect, and `caddy validate`.

## 2. Release and rollback tooling

- [x] 2.1 Add a repeatable local packaging command or script that builds the Angular SPA, creates the self-contained `linux-x64` backend release, and stages the SPA in `wwwroot`; verify the resulting artifact starts on Debian and serves `/api/status`.
- [x] 2.2 Add a server-side activation script that installs immutable release directories, switches `current`, restarts the service, and health-checks the release; verify a successful release is reported only after the health check passes.
- [x] 2.3 Add rollback behavior that restores the previous healthy release on activation failure and a documented operator rollback command; deliberately deploy an invalid artifact and verify the prior `/api/status` service remains available.
- [x] 2.4 Document the single-instance restart consequence that active in-memory rooms are cleared; verify deployment output makes this operational impact explicit before release activation.

## 3. Application configuration

- [x] 3.1 Add `https://poqr.snay.me` to the production CORS allow-list while retaining `https://poqr.azurewebsites.net` and credential support; verify `dotnet build Poqr.sln` succeeds and browser-origin requests from both allowed origins pass preflight/credential checks.
- [x] 3.2 Configure `APPLICATIONINSIGHTS_CONNECTION_STRING` only through the protected server environment file; verify the service starts with and without the setting and that configured telemetry appears in the existing Application Insights resource.

## 4. Continuous deployment automation

- [x] 4.1 Change the Azure workflow to manual dispatch only while retaining Bicep and the manual Azure recovery path; verify a push to `master` does not start an Azure infrastructure or App Service deployment.
- [x] 4.2 Add a GitHub Actions server deployment workflow that builds, packages, uploads over SSH using the dedicated CI key and pinned host key, activates the release, and fails on health-check failure; verify it never references the interactive `deploy` SSH key or passphrase.
- [x] 4.3 Add protected GitHub secrets/environment configuration for the CI private key, server hostname, and pinned host key; verify a workflow run deploys a release without exposing secret values in logs.

## 5. Documentation and end-to-end validation

- [x] 5.1 Update README.md and AGENTS.md with the Debian bootstrap, domain/DNS prerequisite, local deploy, CI deploy, rollback, telemetry, and manual Azure recovery procedures; verify commands and artifact locations match the implemented scripts and workflows.
- [x] 5.2 Run `dotnet build Poqr.sln`, `cd src/Poqr.Api.Tests && dotnet test`, `cd src/Poqr.Web && npm run build`, and `cd src/Poqr.Web && npm run test`; verify all relevant checks pass.
- [x] 5.3 Verify the public HTTPS endpoint in two browser tabs, including room updates and a temporary reconnect through `/hubs/poker`; verify the configured public hostname, HTTP redirect, SPA route fallback, API status, and SignalR WebSocket behavior all work.
