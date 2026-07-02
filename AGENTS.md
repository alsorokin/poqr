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
- Run frontend build: `cd src/Poker.Web && npm run build`
- For realtime/session behavior changes, manually verify with two browser tabs.

## Deployment notes (Azure App Service)

- Previous deploy target used: `pokerweu-2607021311-apiw-4773` in resource group `pokerweu-2607021311-rg`.
- Avoid packaging nested publish folders repeatedly.
  - Prefer publishing to a clean output directory and zipping that directory once.
  - Clean temporary artifacts after deploy when possible.

## Known constraints

- Current design is single-instance in-memory state; scaling out requires shared state/backplane.
- No authentication in v1.
