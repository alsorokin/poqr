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
- For realtime/session behavior changes, manually verify with two browser tabs.

## Documentation sync rule

- When adding/changing commands, tests, scripts, project layout, or workflow expectations, update `README.md` in the same change.
- If the change affects agent workflow/runbooks, also update `AGENTS.md` in the same change.
- Do not consider a task complete until documentation reflects the new behavior.

Test runner note:

- Frontend tests no longer require a system Chrome binary; `npm run test` sets `CHROME_BIN` to Puppeteer's bundled Chromium.

## Deployment notes (Azure App Service)

- Infrastructure is defined in `infra/` as Bicep (IaC). All resource changes must go through Bicep — do not edit Azure resources manually.
- Current deploy target: App Service `poqr` in resource group `poqr-rg` (West Europe).
- GitHub Actions workflow runs three jobs: `infra` (Bicep deploy) and `build` in parallel, then `deploy` once both finish.
- Required GitHub secrets (auto-generated names, aliased in workflow `env:` to clean names): `AZUREAPPSERVICE_CLIENTID_...`, `AZUREAPPSERVICE_TENANTID_...`, `AZUREAPPSERVICE_SUBSCRIPTIONID_...` (OIDC; service principal needs Contributor at subscription scope).
- Avoid packaging nested publish folders repeatedly.
  - Prefer publishing to a clean output directory and zipping that directory once.
  - Clean temporary artifacts after deploy when possible.
- Keep the CI package shape aligned with manual deploys: build Angular first, publish the API to a clean directory, then copy `src/Poqr.Web/dist/poqr-web/browser/.` into the published `wwwroot/` before deploy.
- Deployment flow:
  - `cd src/Poqr.Web && npm run build`
  - `dotnet publish src/Poqr.Api/Poqr.Api.csproj -c Release -o /tmp/poqr-publish`
  - Remove `/tmp/poqr-publish/publish` and `/tmp/poqr-publish/out` if they exist.
  - Copy `src/Poqr.Web/dist/poqr-web/browser/.` into `/tmp/poqr-publish/wwwroot/`.
  - Zip `/tmp/poqr-publish` once and deploy with `az webapp deploy --name poqr --resource-group poqr-rg --type zip`.
  - Clean up `/tmp/poqr-publish` and the zip file after deploy.

## Known constraints

- Current design is single-instance in-memory state; scaling out requires shared state/backplane.
- No authentication in v1.
