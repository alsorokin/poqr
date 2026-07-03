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
- Remember the last participant name locally in the browser
- Realtime room updates with SignalR
- Start round (any participant)
- Cast/replace vote (before reveal)
- Reveal at any time (does not require all votes)
- Show average after reveal
- Start new vote after reveal (any participant)
- Preserve session membership across temporary disconnects (for example phone lock/unlock)
- Disconnected participants are automatically removed after 5 minutes offline
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

## GitHub Actions deploy package

The GitHub Actions workflow for `poqr` builds the frontend and backend separately, then deploys a single combined App Service package:

```bash
cd src/Poker.Web
npm ci
npm run build

cd /home/snay/src/poker
dotnet publish src/Poker.Api/Poker.Api.csproj -c Release -o /tmp/poqr-publish
rm -rf /tmp/poqr-publish/publish /tmp/poqr-publish/out
rm -rf /tmp/poqr-publish/wwwroot/*
cp -r src/Poker.Web/dist/poker-web/browser/. /tmp/poqr-publish/wwwroot/
```

That final `/tmp/poqr-publish` directory is what gets uploaded and deployed by the workflow.

## Deploy to Azure App Service

The app is deployed as a single zip package to Azure App Service. Use a clean publish directory so the package does not contain nested `publish/` or `out/` folders.

```bash
cd src/Poker.Web
npm run build

rm -rf /tmp/poker-publish
dotnet publish ../Poker.Api/Poker.Api.csproj -c Release -o /tmp/poker-publish
rm -rf /tmp/poker-publish/publish /tmp/poker-publish/out
rm -rf /tmp/poker-publish/wwwroot/*
cp -r dist/poker-web/browser/. /tmp/poker-publish/wwwroot/

cd /tmp/poker-publish
zip -r /tmp/poker-deploy.zip .
az webapp deploy --name pokerweu-2607021311-apiw-4773 --resource-group pokerweu-2607021311-rg --src-path /tmp/poker-deploy.zip --type zip
az webapp start --name pokerweu-2607021311-apiw-4773 --resource-group pokerweu-2607021311-rg
```

Deployment target:

- App Service: `pokerweu-2607021311-apiw-4773`
- Resource group: `pokerweu-2607021311-rg`

## Run tests

Frontend unit tests use Karma with Puppeteer-managed headless Chromium, so a system Chrome install is not required.

Backend unit tests use xUnit and cover core room/session lifecycle behavior in `RoomStore`.

```bash
cd src/Poker.Web
npm run test
```

```bash
cd src/Poker.Api.Tests
dotnet test
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
