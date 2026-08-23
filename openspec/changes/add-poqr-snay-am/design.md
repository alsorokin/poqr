## Context

See proposal.md for motivation. The Debian server is the active production
target. Its Caddy configuration currently declares only `poqr.snay.me` and
proxies all application traffic, including SignalR WebSockets, to the
single in-memory Poqr instance. The production CORS policy explicitly allows
the Azure hostname and `poqr.snay.me`. The Angular client uses the browser
origin for production API and hub URLs.

## Goals / Non-Goals

**Goals:**

- Make `poqr.snay.am` a fully equivalent HTTPS entry point for the existing
  Debian deployment.
- Preserve direct, same-origin API and SignalR traffic—including WebSocket
  upgrades and reconnect behavior—on both Poqr hostnames during migration.
- Establish `poqr.snay.am` as the canonical hostname and define a reversible
  retirement path for `poqr.snay.me`.
- Leave the existing `snay.am` apex website untouched.

**Non-Goals:**

- Adding an apex-domain alias, new DNS provider, or third hostname such as
  `www`.
- Changing the frontend client, REST routes, SignalR methods/events, C#
  contracts, room lifecycle, or release packaging.
- Modifying the Azure Bicep recovery path or the GitHub Actions deployment
  workflow.

## Decisions

### Use a dedicated `poqr` subdomain under `snay.am`

Create a DNS record for `poqr.snay.am` that points at the current Debian
server rather than moving `snay.am`. This preserves the independently hosted
apex site while placing Poqr under the newly approved domain.

The alternative—pointing `snay.am` directly at Poqr—would replace the
currently served apex site and was explicitly ruled out.

### Stage the legacy hostname retirement

Initially, configure Caddy to proxy both `poqr.snay.me` and `poqr.snay.am` to
the existing application so existing bookmarks and sessions remain functional.
After an approved migration window, change the `poqr.snay.me` site to redirect
to the equivalent `poqr.snay.am` URL while retaining its TLS certificate for
the redirect. Caddy remains responsible for HTTP-to-HTTPS redirection,
certificate issuance and renewal, and forwarding normal HTTP and WebSocket
traffic for the active hostname to `127.0.0.1:8080`.

The initial dual-proxy configuration avoids breaking active links. A
permanent dual-host configuration was rejected because it keeps the legacy
domain operational indefinitely; immediate redirection was rejected because it
would not provide a migration window.

### Explicitly allow the new production origin

Add `https://poqr.snay.am` to the production CORS allow-list, retaining the
Azure and `poqr.snay.me` origins during migration. When the old hostname is
changed to a redirect, remove `https://poqr.snay.me` from the CORS allow-list.
Although a browser using the new hostname will normally make same-origin
requests, the explicit policy preserves the deployment's declared
compatibility for API and SignalR clients.

No frontend URL configuration changes are needed because production URLs are
derived from `window.location.origin`.

### Keep Azure recovery and CI unchanged

The Bicep definition and GitHub Actions workflow do not own the Debian
hostname or Caddy configuration and require no changes. WebSocket support
continues to be provided by Caddy and the existing reverse proxy.

## Risks / Trade-offs

- [The DNS record has not propagated when Caddy requests a certificate] →
  Create and verify the `poqr.snay.am` record points to the Debian server
  before reloading Caddy.
- [The new hostname receives an invalid or missing certificate] → Validate the
  Caddy configuration and test HTTPS certificate verification before
  announcing the hostname.
- [A Caddy configuration error disrupts the existing hostname] → Use Caddy's
  configuration validation before reload; retain the previous configuration
  for immediate restoration.
- [A new CORS origin is omitted or misspelled] → Validate API and SignalR
  connectivity from `https://poqr.snay.am` and recheck existing
  `poqr.snay.me` behavior.
- [Legacy links or sessions are still in use when retirement begins] → Keep
  the old hostname as a TLS-protected redirect until the approved migration
  period completes and retain the preceding Caddy configuration for rollback.

## Migration Plan

1. Add the `poqr.snay.am` DNS record for the existing Debian server and wait
   until public resolution reaches that address; do not alter `snay.am`.
2. Deploy the application release that includes the CORS allow-list and
   documentation changes through the existing versioned release process.
3. Install the dual-host Caddy configuration, validate it, and reload Caddy
   so it can obtain the additional certificate.
4. Verify HTTPS, SPA delivery, `/api/status`, and SignalR WebSocket/reconnect
   behavior on both public hostnames with two browser tabs during the
   migration period.
5. After an approved migration period, replace the `poqr.snay.me` proxy with
   an equivalent-path HTTPS redirect to `poqr.snay.am`, remove the old origin
   from CORS, and verify existing deep links redirect correctly.
6. Retain the redirect and its certificate until the planned domain shutdown;
   then remove the legacy Caddy site and DNS record. If retirement fails,
   restore the preceding dual-proxy configuration and the old CORS origin.
