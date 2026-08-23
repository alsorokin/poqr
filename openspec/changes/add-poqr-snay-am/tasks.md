## 1. Backend origin configuration

- [ ] 1.1 Add `https://poqr.snay.am` to the production CORS allow-list in `src/Poqr.Api/Program.cs` while retaining the existing Azure and `poqr.snay.me` origins; verify `dotnet test` succeeds from `src/Poqr.Api.Tests`.
- [ ] 1.2 After the approved `poqr.snay.me` migration period, remove that origin from the production CORS allow-list in a separate release; verify requests from `https://poqr.snay.am` continue to work and the published policy no longer lists the legacy origin.

## 2. DNS and reverse proxy

- [ ] 2.1 Create a `poqr.snay.am` DNS record pointing to the active Debian server without changing the `snay.am` apex record; verify public DNS resolution reaches the Debian server address.
- [ ] 2.2 Update `deploy/server/Caddyfile` to serve both `poqr.snay.me` and `poqr.snay.am` through the existing `127.0.0.1:8080` proxy; verify `caddy validate --config /etc/caddy/Caddyfile` succeeds after installation on the server.
- [ ] 2.3 Deploy the release through the existing versioned activation process, reload Caddy after DNS propagation, and verify each hostname has a valid HTTPS certificate.
- [ ] 2.4 After the approved migration period, replace the `poqr.snay.me` proxy with an equivalent-path HTTPS redirect to `poqr.snay.am` while retaining its certificate; verify deep links redirect and `poqr.snay.am` remains healthy.
- [ ] 2.5 After the redirect retention period, remove the `poqr.snay.me` Caddy site and DNS record; verify the canonical hostname remains healthy and the prior Caddy configuration can be restored if needed.

## 3. Documentation

- [ ] 3.1 Update `README.md` and `AGENTS.md` to describe `poqr.snay.am` as the canonical hostname, the migration and retirement schedule for `poqr.snay.me`, its DNS setup, and the requirement to preserve the `snay.am` apex site; verify the documented Caddy configuration matches `deploy/server/Caddyfile`.

## 4. End-to-end validation

- [ ] 4.1 Verify both `https://poqr.snay.me` and `https://poqr.snay.am` serve the SPA and return success from `/api/status`; verify HTTP requests redirect to their corresponding HTTPS hostnames.
- [ ] 4.2 From `https://poqr.snay.am`, verify a browser can create or join a session and establish a SignalR WebSocket connection; verify the same flow remains functional from `https://poqr.snay.me`.
- [ ] 4.3 Verify real-time behavior with two browser tabs, including a participant reconnect on the new hostname, and confirm room updates and membership lifecycle remain unchanged.
- [ ] 4.4 During retirement, verify `https://poqr.snay.me` redirects SPA, API, and deep-link requests to equivalent `https://poqr.snay.am` URLs and that the legacy origin is absent from CORS.
