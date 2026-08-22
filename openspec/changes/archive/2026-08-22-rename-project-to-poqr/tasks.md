## 1. Backend and Contract Identity

- [x] 1.1 Rename the solution, backend/test directories, and `.csproj` files from `Poker` to `Poqr`; update solution entries and project references, then verify `dotnet build Poqr.sln` succeeds.
- [x] 1.2 Rename backend and test C# namespaces/usings from `Poker.Api` to `Poqr.Api`, including contracts, controllers, hubs, room services, and tests; verify `cd src/Poqr.Api.Tests && dotnet test` passes.
- [x] 1.3 Preserve the existing REST routes and `/hubs/poker` SignalR endpoint while changing internal identity; verify route declarations and SignalR client invocation names are unchanged by a focused diff/search.

## 2. Frontend Identity and Product Branding

- [x] 2.1 Rename the Angular package and workspace project identity from `poker-web` to `poqr-web`, including all target references; verify `cd src/Poqr.Web && npm run build` emits `dist/poqr-web/browser`.
- [x] 2.2 Replace visible `Planning Poker` branding and browser title/description metadata with `Poqr`; update Angular assertions and verify `cd src/Poqr.Web && npm run test` passes.

## 3. Infrastructure and Deployment

- [x] 3.1 Update Bicep so the App Service startup command executes `./Poqr.Api`, while retaining existing `poqr` resource names, hostname, CORS origin, and WebSocket configuration; verify a Release self-contained publish produces the matching executable.
- [x] 3.2 Update the GitHub Actions workflow’s source paths and frontend packaging source to the renamed projects and `dist/poqr-web/browser`; verify workflow YAML has no stale `Poker`/`poker-web` path references and still deploys to App Service `poqr`.
- [x] 3.3 Update tracked ignore rules and workflow artifacts/temporary-path references that identify renamed source/build outputs; verify a repository search finds no stale `Poker` source-path or `poker-web` build-output references outside intentional historical artifacts.

## 4. Documentation and Validation

- [x] 4.1 Update README.md, AGENTS.md, OpenSpec context, and frontend documentation with `Poqr` product branding and renamed commands/paths; verify every documented local build, test, and manual deployment command uses the new paths.
- [x] 4.2 Run `dotnet build Poqr.sln`, `cd src/Poqr.Api.Tests && dotnet test`, `cd src/Poqr.Web && npm run build`, and `cd src/Poqr.Web && npm run test`; verify all commands pass.
- [x] 4.3 Inspect the final tracked diff and search results to confirm the GitHub repository, Azure resource names, `poqr.azurewebsites.net` hostname, `/api/*` routes, and `/hubs/poker` hub route remain unchanged.
