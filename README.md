# Poqr (Angular + .NET)

First implementation slice of an anonymous planning poker app.

## Stack

- Frontend: Angular SPA (`src/Poqr.Web`)
- Backend: ASP.NET Core + SignalR (`src/Poqr.Api`)
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
cd src/Poqr.Api
dotnet run
```

Backend listens on `http://localhost:5057`.

### 2) Frontend

```bash
cd src/Poqr.Web
npm install
npm start
```

Frontend runs at `http://localhost:4200`.

Open it in multiple tabs/browsers to simulate participants.

## Build checks

```bash
dotnet build Poqr.sln
cd src/Poqr.Web && npm run build
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
| App Service Plan | `asp-poqr` | B1 Linux — WebSockets enabled |
| App Service | `poqr` | .NET 10, HTTPS-only |
| Application Insights | `appi-poqr` | Workspace-based |
| Log Analytics workspace | `log-poqr` | 30-day retention |

> **Why B1?** The Basic tier supports **WebSockets** (required for SignalR). Free/Shared tiers lack this feature.

### Deploy infrastructure manually

```bash
az deployment sub create \
  --name poqr-infra \
  --location westeurope \
  --template-file infra/main.bicep
```

### GitHub Actions secrets required

The workflow uses OIDC (federated identity). The following secrets are currently configured (auto-generated names from the original App Service deploy wizard):

| Secret | Value |
|---|---|
| `AZUREAPPSERVICE_CLIENTID_7785DF056FD348D493EA0655CDED4CBB` | App registration client ID |
| `AZUREAPPSERVICE_TENANTID_8A60F6B7A67D4012A87E345BF23C25BB` | Azure AD tenant ID |
| `AZUREAPPSERVICE_SUBSCRIPTIONID_B813E682DE5744C394E3C037F984DE23` | Target subscription ID |

They are aliased in the workflow `env:` block to `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` / `AZURE_SUBSCRIPTION_ID`. To use cleaner names, add new secrets with those names and update the `env:` block accordingly.

The service principal must have **Contributor** role at subscription scope so it can create the resource group and resources.

### CI/CD workflow

The workflow (`.github/workflows/master_poqr.yml`) has three jobs on every push to `master`:

1. **infra** — deploys Bicep (idempotent; creates/updates Azure resources)
2. **build** — builds frontend + backend, uploads artifact *(runs in parallel with infra)*
3. **deploy** — waits for both, then deploys the zip package to App Service

### Deploy to Azure App Service manually

```bash
cd src/Poqr.Web
npm run build

rm -rf /tmp/poqr-publish
dotnet publish src/Poqr.Api/Poqr.Api.csproj -c Release -o /tmp/poqr-publish
rm -rf /tmp/poqr-publish/publish /tmp/poqr-publish/out
rm -rf /tmp/poqr-publish/wwwroot/*
cp -r src/Poqr.Web/dist/poqr-web/browser/. /tmp/poqr-publish/wwwroot/

cd /tmp/poqr-publish
zip -r /tmp/poqr-deploy.zip .
az webapp deploy --name poqr --resource-group poqr-rg --src-path /tmp/poqr-deploy.zip --type zip
rm /tmp/poqr-deploy.zip && rm -rf /tmp/poqr-publish
```

## Run tests

Frontend unit tests use Karma with Puppeteer-managed headless Chromium, so a system Chrome install is not required.

Backend unit tests use xUnit and cover core room/session lifecycle behavior in `RoomStore`.

```bash
cd src/Poqr.Web
npm run test
```

```bash
cd src/Poqr.Api.Tests
dotnet test
```

Optional variants:

```bash
npm run test:watch
npm run test:ci
npm run test:e2e
```

`npm run test:e2e` starts isolated local API and frontend servers, then runs
every `src/Poqr.Web/e2e/*.e2e.mjs` scenario with Puppeteer. Add a scenario module
exporting `name` and `run(context)` to extend browser coverage. The initial
cinema-logo scenario verifies two-tab propagation, repeated activations,
active/revealed rounds, and rejoining; room scoping is covered by backend hub
tests. The command requires ports 4200 and 5057 to be available.

## Notes

- Data is intentionally ephemeral for v1 (server restart clears sessions).
- This is single-instance in-memory state, suitable for the initial 10+ user target.
- Angular CLI warns when using odd-numbered Node versions (for example v25); prefer an LTS Node version for development and CI.
