## Why

The repository and Azure deployment use the preferred `poqr` identity, while the
source tree and user-facing product still use the legacy Poker identity.
Aligning them gives the project a coherent identity without changing its
planning-poker functionality or deployed service identity.

## What Changes

- **BREAKING (internal build paths):** Rename the .NET solution, projects,
  source directories, C# namespaces, and self-contained backend executable from
  `Poker` to `Poqr`.
- Rename the Angular package and workspace project identity from `poker-web` to
  `poqr-web`, including its production output path.
- Replace user-facing `Planning Poker` branding with `Poqr` in the application,
  browser metadata, tests, and documentation.
- Update all solution, project-reference, CI/CD, Bicep startup-command,
  ignore-rule, documentation, OpenSpec-context, and agent-workflow references
  to the renamed source artifacts.
- Preserve the existing `poqr` GitHub repository, Azure resource names, App
  Service hostname, CORS origin, deployment workflow behavior, public API
  routes, and SignalR hub route.

## Capabilities

### New Capabilities

- `product-branding`: Display the Poqr product identity consistently in
  user-facing application and browser surfaces.

### Modified Capabilities

None.

## Impact

- **Backend:** renamed solution/project paths, assembly identity, C# namespaces,
  project references, and Bicep Linux startup command.
- **Frontend:** renamed Angular workspace/package identity and build output
  directory, plus visible product branding and browser metadata.
- **Shared contracts:** C# contract namespaces change internally; REST and
  SignalR payloads and routes remain unchanged.
- **Infrastructure and CI/CD:** publishing and packaging paths change while the
  existing Azure deployment target remains unchanged.
- **Documentation:** README, AGENTS.md, and OpenSpec project context must use
  the new source names and product branding.
- **Non-goals:** persistence, authentication, multi-instance support, Azure
  resource migration, hostname migration, and API changes.
