# AGENTS.md

Purpose: fast onboarding for coding agents working in this repository.

## Project layout

- Solution: `Poker.sln`
- Backend API (ASP.NET Core + SignalR): `src/Poker.Api`
- Frontend SPA (Angular): `src/Poker.Web`

## Product context

- Anonymous planning poker app.
- Uses in-memory room/session state (ephemeral by design).
- Card deck: `1, 2, 3, 5, 8, 13, 21, Joker`.

## Local dev commands

- Backend:
  - `cd src/Poker.Api`
  - `dotnet run`
  - Expected URL: `http://localhost:5057`
- Frontend:
  - `cd src/Poker.Web`
  - `npm install`
  - `npm start`
  - Expected URL: `http://localhost:4200`
- Build checks:
  - `dotnet build Poker.sln`
  - `cd src/Poker.Web && npm run build`
- Backend tests (xUnit):
  - `cd src/Poker.Api.Tests && dotnet test`
- Frontend tests (Karma + Puppeteer headless Chromium):
  - `cd src/Poker.Web && npm run test`
  - `cd src/Poker.Web && npm run test:watch`

## Agent workflow expectations

- Prefer minimal, targeted edits. Avoid broad refactors unless requested.
- Do not edit generated/build output directories:
  - `**/bin/**`
  - `**/obj/**`
  - `**/publish/**`
  - `src/Poker.Api/wwwroot/**` (unless task is specifically about static publish artifacts)
- Prefer changing source files under:
  - `src/Poker.Api/Controllers`
  - `src/Poker.Api/Hubs`
  - `src/Poker.Api/Rooms`
  - `src/Poker.Api/Contracts`
  - `src/Poker.Web/src/app`
- Keep backend/frontend contract changes synchronized (SignalR payloads + TypeScript types).

## Testing/validation before handoff

- Run backend build: `dotnet build Poker.sln`
- Run backend tests when backend behavior changes: `cd src/Poker.Api.Tests && dotnet test`
- Run frontend build: `cd src/Poker.Web && npm run build`
- Run frontend tests when UI/service logic changed: `cd src/Poker.Web && npm run test`
- For realtime/session behavior changes, manually verify with two browser tabs.

## Documentation sync rule

- When adding/changing commands, tests, scripts, project layout, or workflow expectations, update `README.md` in the same change.
- If the change affects agent workflow/runbooks, also update `AGENTS.md` in the same change.
- Do not consider a task complete until documentation reflects the new behavior.

Test runner note:

- Frontend tests no longer require a system Chrome binary; `npm run test` sets `CHROME_BIN` to Puppeteer's bundled Chromium.

## Deployment notes (Azure App Service)

- Previous deploy target used: `pokerweu-2607021311-apiw-4773` in resource group `pokerweu-2607021311-rg`.
- Avoid packaging nested publish folders repeatedly.
  - Prefer publishing to a clean output directory and zipping that directory once.
  - Clean temporary artifacts after deploy when possible.

## Known constraints

- Current design is single-instance in-memory state; scaling out requires shared state/backplane.
- No authentication in v1.
