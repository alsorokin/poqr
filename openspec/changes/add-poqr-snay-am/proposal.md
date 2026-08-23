## Why

Poqr is currently available only at `poqr.snay.me`. Making it available at
`poqr.snay.am` gives the application a hostname under the newly approved
`snay.am` domain while preserving the existing public endpoint.

## What Changes

- Add `poqr.snay.am` as a second public HTTPS hostname for the Debian-hosted
  Poqr application.
- Configure a migration period in which the reverse proxy and production origin
  policy serve the SPA, REST API, and SignalR hub correctly from either Poqr
  hostname.
- Plan the eventual retirement of `poqr.snay.me` by redirecting it to
  `poqr.snay.am`, then removing its DNS, TLS, and CORS configuration after the
  migration window.
- Document the DNS, TLS, rollout, retirement, and validation procedures.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `debian-server-deployment`: The Debian deployment shall support
  `poqr.snay.am` alongside `poqr.snay.me` during migration, then retire
  `poqr.snay.me` without disrupting the canonical public origin.

## Impact

- **Backend:** Production CORS configuration during migration and its later
  removal for the retired hostname.
- **Infrastructure:** DNS record provisioning and Caddy virtual-host/TLS
  configuration on the Debian server, followed by the legacy-host redirect and
  retirement.
- **Documentation:** Deployment, migration, and domain retirement instructions.
- **Frontend/shared contracts:** No changes; the client already derives API
  and SignalR URLs from its current origin.
- **Non-goals:** Moving or changing the existing `snay.am` apex website,
  changing room behavior, authentication, persistence, or multi-instance
  support.
