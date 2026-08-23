## Why

The production two-tab browser check timed out even though the same workflow
worked manually. The harness treated rendered room UI and a fixed delay as
proof that SignalR room membership was ready, which is unreliable outside the
low-latency local environment.

## What Changes

- Make browser scenarios wait for an observable SignalR-ready condition instead
  of an arbitrary delay before testing cross-tab events.
- Support running the existing two-tab browser scenarios against an explicitly
  supplied public application origin without starting local servers.
- Preserve actionable diagnostics when a browser scenario fails in a deployed
  environment.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None.

## Impact

- **Frontend:** Puppeteer E2E runner and browser scenarios.
- **Backend/shared contracts/infrastructure:** No functional changes.
- **Documentation:** Test commands and production-smoke-test guidance.
- **Non-goals:** Changing SignalR hub behavior, room state, production routing,
  authentication, persistence, or multi-instance support.
