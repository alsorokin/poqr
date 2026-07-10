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

## Azure infrastructure (Bicep / IaC)

All Azure resources are defined in `infra/`:

```
infra/
  main.bicep           # subscription-scope entry point; creates poqr-rg
  modules/
    webapp.bicep       # App Service Plan + Web App + App Insights + Log Analytics
```

### Provisioned resources

| Resource | Name | Notes |
|---|---|---|
| Resource group | `poqr-rg` | West Europe |
| App Service Plan | `asp-poqr` | B1 Linux — AlwaysOn, WebSockets |
| App Service | `poqr` | .NET 9, HTTPS-only |
| Application Insights | `appi-poqr` | Workspace-based |
| Log Analytics workspace | `log-poqr` | 30-day retention |

> **Why B1?** The Basic tier enables **AlwaysOn** (no cold starts) and **WebSockets** (required for SignalR). Free/Shared tiers lack both features and will cause multi-second latency on first connection.

### Deploy infrastructure manually

```bash
az deployment sub create \
  --name poqr-infra \
  --location westeurope \
  --template-file infra/main.bicep
```

### GitHub Actions secrets required

The workflow uses OIDC (federated identity). Set these three secrets in the repository:

| Secret | Value |
|---|---|
| `AZURE_CLIENT_ID` | App registration client ID |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Target subscription ID |

The service principal must have **Contributor** role at subscription scope so it can create the resource group and resources.

### CI/CD workflow

The workflow (`.github/workflows/master_poqr.yml`) has three jobs on every push to `master`:

1. **infra** — deploys Bicep (idempotent; creates/updates Azure resources)
2. **build** — builds frontend + backend, uploads artifact *(runs in parallel with infra)*
3. **deploy** — waits for both, then deploys the zip package to App Service

### Deploy to Azure App Service manually

```bash
cd src/Poker.Web
npm run build

rm -rf /tmp/poqr-publish
dotnet publish src/Poker.Api/Poker.Api.csproj -c Release -o /tmp/poqr-publish
rm -rf /tmp/poqr-publish/publish /tmp/poqr-publish/out
rm -rf /tmp/poqr-publish/wwwroot/*
cp -r src/Poker.Web/dist/poker-web/browser/. /tmp/poqr-publish/wwwroot/

cd /tmp/poqr-publish
zip -r /tmp/poqr-deploy.zip .
az webapp deploy --name poqr --resource-group poqr-rg --src-path /tmp/poqr-deploy.zip --type zip
rm /tmp/poqr-deploy.zip && rm -rf /tmp/poqr-publish
```

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
