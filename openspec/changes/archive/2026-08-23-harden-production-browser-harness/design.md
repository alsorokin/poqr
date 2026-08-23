## Context

See proposal.md for motivation. The Puppeteer E2E runner starts local API and
SPA servers, and scenarios currently treat room UI rendering plus a 250 ms
sleep as evidence that both browser tabs have joined their SignalR group. A
production reproduction showed that the UI can render before `JoinSession`
finishes, allowing a cross-tab event to be sent before its recipient is a
group member.

## Goals / Non-Goals

**Goals:**

- Make cross-tab scenarios wait for verified group membership before exercising
  hub broadcasts.
- Allow the existing production-equivalent browser scenarios to run against a
  supplied HTTPS origin without spawning or modifying local servers.
- Produce bounded, useful failure evidence from the browser harness.

**Non-Goals:**

- Changing `PokerHub`, `RoomStore`, hub methods, application contracts, or
  production deployment behavior.
- Adding a continuous production-monitoring service or running production
  smoke tests automatically on every deployment.

## Decisions

### Use the joining tab's SignalR room-state frame as the readiness signal

The harness will wait for the joining tab to receive its first
`RoomStateUpdated` SignalR frame after it invokes `JoinSession`. The server
sends that frame only after adding the joining connection to the SignalR group,
so it is a direct, payload-free proof that the tab can receive later group
broadcasts.

The alternative—a larger fixed sleep—remains timing-dependent and can still
fail as network or host latency changes. Waiting for browser-rendered
participant state is insufficient because the REST join response can mark the
joining participant connected before the hub group registration finishes.
Exposing a test-only client readiness API would add production code solely for
test orchestration.

### Separate local and external-origin runner modes

The E2E runner will retain its current default mode, which starts local API and
SPA servers. An explicit origin argument or environment variable will select
external mode, where the runner starts no servers and targets the supplied
HTTPS origin. External mode is opt-in so normal local and CI test behavior
does not require deployed credentials or network access.

### Capture diagnostics only when a scenario fails

For external-mode failures, retain browser console messages, page errors, and
failed requests in the test error output. Do not emit these details on success
or include browser storage, room identifiers, or response bodies, which could
make routine output noisy or expose session data.

## Risks / Trade-offs

- [The connected-participant rendering lags behind completed group membership]
  → Wait with a bounded timeout and include the observed participant state in
  the failure message.
- [Production tests accidentally target an unintended host] → Require an
  explicit HTTPS origin and print it at test start.
- [External availability creates flaky CI] → Keep external mode manual-only;
  local E2E remains the automated default.

## Migration Plan

1. Update the runner and cinema-logo scenario while preserving the current
   local command behavior.
2. Run the local browser suite to establish compatibility.
3. Run the external mode manually against `https://poqr.snay.am` and confirm
   the two-tab scenario completes.
4. If external mode exposes a real application regression, keep its diagnostic
   output and investigate separately; revert the harness change if it breaks
   the default local runner.
