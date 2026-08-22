## Context

See proposal.md for motivation. The deployed system already has a stable `poqr`
GitHub/Azure identity, while its solution, source paths, namespaces, Angular
workspace, build output, and product label use Poker variants. The backend is
published self-contained, so its assembly name produces the executable named by
the Linux App Service startup command.

## Goals / Non-Goals

**Goals:**

- Establish `Poqr` as the source and assembly namespace/path identity.
- Establish `poqr-web` as the Angular workspace and build-output identity.
- Establish `Poqr` as the product label in visible UI, browser metadata, tests,
  and end-user documentation.
- Preserve the stable `poqr` deployment resource names, hostname, and workflow
  deployment destination.

**Non-Goals:**

- Rename or recreate the GitHub repository, Azure resource group, App Service,
  plan, Application Insights component, Log Analytics workspace, or hostname.
- Change the anonymous room lifecycle, REST routes, SignalR hub route/events,
  contracts, authorization, or in-memory architecture.

## Decisions

### Use `Poqr` for source and assembly identity

Rename the solution, .NET directories, project files, namespaces, solution
entries, project references, and generated backend executable together. This
makes paths, imports, and the deployment startup command agree and avoids a
partially renamed build identity.

The alternative is retaining `Poker.Api` as the assembly while changing only
directories. That preserves a legacy identity in namespaces and the published
executable, so it does not meet the coherence goal.

### Use `poqr-web` for Angular machine-readable identity

Rename the package `name`, Angular project key, target references, and generated
distribution directory as one unit. Update CI/manual publishing to copy the
renamed directory into the backend `wwwroot`.

The alternative is keeping `poker-web` as an internal package identifier. It
would leave the legacy name in the build artifacts and deployment script.

### Treat Azure `poqr` identifiers as stable external infrastructure

Keep the existing Bicep resource names, App Service host, workflow deployment
target, production CORS origin, and deployment-run name based on `poqr`. Only
the Bicep `appCommandLine` changes from `./Poker.Api` to `./Poqr.Api` to match
the renamed publish output. WebSockets remain enabled.

Creating renamed Azure resources would change the public hostname and replace
telemetry/resource continuity, which is outside this rename.

### Retain interfaces while changing internal namespaces

The REST paths (`/api/*`, including `/api/status`) and SignalR hub path
(`/hubs/poker`) remain unchanged. C# contract namespaces and all consuming
usings are renamed together, while TypeScript types and SignalR handlers retain
their wire behavior. RoomStore remains the authoritative owner of room and
round rules.

Changing API or hub route names would add unnecessary client compatibility
breakage without advancing the requested identity alignment.

## Risks / Trade-offs

- [Case-only or multi-file filesystem renames can be missed by Git] -> Perform
  explicit moves, inspect the staged rename set, and search for stale source
  identity references.
- [The self-contained executable name can diverge from Bicep startup command]
  -> Validate a Release publish output and ensure `appCommandLine` matches it.
- [Angular output rename can break packaging] -> Build the frontend and verify
  the CI/manual copy source uses `dist/poqr-web/browser`.
- [Branding may remain in metadata or assertions] -> Search tracked source and
  documentation for user-facing `Planning Poker` and update focused Angular
  coverage.

## Migration Plan

1. Rename tracked source and project artifacts, then update references
   atomically.
2. Update frontend branding and browser metadata without changing session or
   realtime behavior.
3. Update Bicep startup command and CI/manual packaging paths while retaining
   the existing Azure resource and hostname identities.
4. Run backend/frontend builds and tests, then verify a package contains the
   `Poqr.Api` executable and the `poqr-web` browser output.
5. Deploy through the existing workflow. Roll back by redeploying the last
   successful artifact; source rollback restores the former startup command and
   source paths together.
