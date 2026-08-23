## 1. SignalR readiness synchronization

- [x] 1.1 Add a reusable E2E helper that waits for the joining tab to receive a `RoomStateUpdated` SignalR frame after joining; verify it times out with redacted received-message types when that frame never arrives.
- [x] 1.2 Replace the cinema-logo scenario's fixed post-join delay with the SignalR readiness helper before its first broadcast assertion; verify `npm run test:e2e` passes locally without timing-based sleeps.

## 2. External-origin runner mode

- [x] 2.1 Add an explicit HTTPS origin option for the E2E runner that skips local API and SPA process startup, rejects invalid origins, and reports the selected target; verify the default runner continues to start local services.
- [x] 2.2 Capture bounded browser console errors, page errors, and failed requests when an external-origin scenario fails; verify successful runs do not emit diagnostics or session data.

## 3. Documentation and validation

- [x] 3.1 Update `README.md` and `AGENTS.md` with the manual command for the external-origin browser smoke test and its production-use boundary; verify the commands match the runner interface.
- [x] 3.2 Run `npm run test:e2e` locally and the external-origin cinema-logo scenario against `https://poqr.snay.am`; verify both browser tabs join, receive logo broadcasts, and a rejoined participant receives subsequent broadcasts.
