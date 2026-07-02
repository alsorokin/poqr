# Planning Poker (Angular + .NET)

First implementation slice of an anonymous planning poker app.

## Stack

- Frontend: Angular SPA (`src/Poker.Web`)
- Backend: ASP.NET Core + SignalR (`src/Poker.Api`)
- State: in-memory room store
- Card deck: Fibonacci capped at 21 plus `Joker` (`1, 2, 3, 5, 8, 13, 21, Joker`)

## Implemented behavior

- Create session without auth
- Join session by shareable code/link
- Realtime room updates with SignalR
- Start round (any participant)
- Cast/replace vote (before reveal)
- Reveal at any time (does not require all votes)
- Show average after reveal
- Start new vote after reveal (any participant)
- Remove session when last participant leaves

## Run locally

### 1) Backend

```bash
cd src/Poker.Api
dotnet run
```

Backend listens on `http://localhost:5057`.

### 2) Frontend

```bash
cd src/Poker.Web
npm install
npm start
```

Frontend runs at `http://localhost:4200`.

Open it in multiple tabs/browsers to simulate participants.

## Build checks

```bash
dotnet build Poker.sln
cd src/Poker.Web && npm run build
```

## Run tests

Frontend unit tests use Karma with Puppeteer-managed headless Chromium, so a system Chrome install is not required.

```bash
cd src/Poker.Web
npm run test
```

Optional variants:

```bash
npm run test:watch
npm run test:ci
```

## Notes

- Data is intentionally ephemeral for v1 (server restart clears sessions).
- This is single-instance in-memory state, suitable for the initial 10+ user target.
- Angular CLI warns when using odd-numbered Node versions (for example v25); prefer an LTS Node version for development and CI.
