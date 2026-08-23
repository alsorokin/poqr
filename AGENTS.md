# AGENTS.md

Purpose: fast onboarding for coding agents working in this repository.

## Project layout

- Solution: `Poqr.sln`
- Backend API (ASP.NET Core + SignalR): `src/Poqr.Api`
- Frontend SPA (Angular): `src/Poqr.Web`
- Azure IaC (Bicep): `infra/`

## Product context

- Anonymous planning poker app.
- Uses in-memory room/session state (ephemeral by design).
- Card deck: `1, 2, 3, 5, 8, 13, 21, Joker`.

## Local dev commands

- Backend:
  - `cd src/Poqr.Api`
  - `dotnet run`
  - Expected URL: `http://localhost:5057`
- Frontend:
  - `cd src/Poqr.Web`
  - `npm install`
  - `npm start`
  - Expected URL: `http://localhost:4200`
- Build checks:
  - `dotnet build Poqr.sln`
  - `cd src/Poqr.Web && npm run build`
- Backend tests (xUnit):
  - `cd src/Poqr.Api.Tests && dotnet test`
- Frontend tests (Karma + Puppeteer headless Chromium):
  - `cd src/Poqr.Web && npm run test`
  - `cd src/Poqr.Web && npm run test:watch`
- Browser E2E test (Puppeteer):
  - `cd src/Poqr.Web && npm run test:e2e`
  - Starts local API/frontend servers and requires ports 5057 and 4200 to be free.
  - Discovers scenarios in `src/Poqr.Web/e2e/*.e2e.mjs`; add a module exporting
    `name` and `run(context)` for new browser coverage.
  - For a manual deployed-origin smoke test, run
    `POQR_E2E_ORIGIN=https://poqr.snay.am npm run test:e2e` from
    `src/Poqr.Web`. This mode starts no local servers and creates anonymous
    test sessions; do not use it as a CI check.

## Agent workflow expectations

- Prefer minimal, targeted edits. Avoid broad refactors unless requested.
- Do not edit generated/build output directories:
  - `**/bin/**`
  - `**/obj/**`
  - `**/publish/**`
  - `src/Poqr.Api/wwwroot/**` (unless task is specifically about static publish artifacts)
- Prefer changing source files under:
  - `src/Poqr.Api/Controllers`
  - `src/Poqr.Api/Hubs`
  - `src/Poqr.Api/Rooms`
  - `src/Poqr.Api/Contracts`
  - `src/Poqr.Web/src/app`
- Keep backend/frontend contract changes synchronized (SignalR payloads + TypeScript types).

## Testing/validation before handoff

- Run backend build: `dotnet build Poqr.sln`
- Run backend tests when backend behavior changes: `cd src/Poqr.Api.Tests && dotnet test`
- Run frontend build: `cd src/Poqr.Web && npm run build`
- Run frontend tests when UI/service logic changed: `cd src/Poqr.Web && npm run test`
- Run `cd src/Poqr.Web && npm run test:e2e` for two-tab SignalR behavior changes.
- For realtime/session behavior changes, manually verify with two browser tabs.

## Documentation sync rule

- When adding/changing commands, tests, scripts, project layout, or workflow expectations, update `README.md` in the same change.
- If the change affects agent workflow/runbooks, also update `AGENTS.md` in the same change.
- Do not consider a task complete until documentation reflects the new behavior.

Test runner note:

- Frontend tests no longer require a system Chrome binary; `npm run test` sets `CHROME_BIN` to Puppeteer's bundled Chromium.

## Deployment notes

- Current production target is one Debian server running `poqr.service` behind
  Caddy. It is a single in-memory instance; every restart clears rooms.
- Package local or CI releases with `./deploy/package-release.sh <release-id>
  <output-directory>`. The package is a self-contained `linux-x64` publish
  with the Angular build copied into `wwwroot`.
- Server release commands are in `deploy/server/`. `poqr-activate` validates
  the archive, atomically selects `current`, restarts the service, and restores
  the previous release if `/api/status` does not become healthy.
- The Debian runtime requires `libicu-dev` (which pulls the matching ICU
  runtime package). Telemetry configuration belongs only in
  `/etc/poqr/poqr.env`, mode `0600`; never commit it.
- The `ci-deploy` SSH account/key is separate from interactive `deploy` access.
  CI uses the `production` GitHub environment secrets `DEPLOY_HOST`,
  `DEPLOY_HOST_KEY`, and `DEPLOY_SSH_PRIVATE_KEY`. Never use or store the
  interactive private key in GitHub.
- `poqr.snay.am` is the canonical Poqr hostname. `poqr.snay.me` must still
  resolve to the server while Caddy retains its TLS-protected,
  equivalent-path redirect to the canonical hostname; do not change the
  independently hosted `snay.am` apex record. Install or change Caddy only
  after the required hostnames resolve. Its configuration must proxy
  `/hubs/poker` with WebSocket support for `poqr.snay.am`. The legacy origin
  is absent from production CORS. Remove the legacy Caddy site and DNS record
  only after the redirect retention period ends.
- Azure infrastructure remains defined in `infra/` as Bicep. The Azure
  workflow is manual-only as a recovery path while
  `.github/workflows/deploy-debian.yml` deploys `master` to Debian.
- Required GitHub secrets (auto-generated names, aliased in workflow `env:` to clean names): `AZUREAPPSERVICE_CLIENTID_...`, `AZUREAPPSERVICE_TENANTID_...`, `AZUREAPPSERVICE_SUBSCRIPTIONID_...` (OIDC; service principal needs Contributor at subscription scope).

## Known constraints

- Current design is single-instance in-memory state; scaling out requires shared state/backplane.
- No authentication in v1.
