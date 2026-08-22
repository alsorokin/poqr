## 1. Real-time logo contract

- [x] 1.1 Add the `ActivateCinemaLogo` hub method that resolves the caller from its registered connection and broadcasts the additive `CinemaLogoActivated` event only to that session; verify valid activations reach the room group and unregistered or stale callers are not broadcast.
- [x] 1.2 Add backend coverage for room scoping, invalid/stale connection rejection, repeated activation forwarding, and activation during active and revealed rounds; verify the focused xUnit tests pass.

## 2. Client behavior and visual identity

- [x] 2.1 Extend `PokerClientService` with the `ActivateCinemaLogo` invocation and `CinemaLogoActivated` observable, including reconnect-compatible event handling; verify Angular service tests cover invoking and receiving the event.
- [x] 2.2 Add the shared `✋🗿✋` and `Poqr` logo to the landing panel and in-room header, mirroring one inline upright hand with CSS and exposing one accessible "Pure cinema" label; make the room version an accessible clickable control and verify Angular component tests cover both views and logo activation.
- [x] 2.3 Add the tilted landing entrance and room activation CSS animations, a restart mechanism that handles every received event, reduced-motion handling, and narrow-layout header styling; verify Angular tests and manual narrow-viewport inspection show no overlap, horizontal overflow, or loss of the mirrored-hand treatment.

## 3. Validation

- [x] 3.1 Run `dotnet test` from `src/Poqr.Api.Tests` and `npm run test` from `src/Poqr.Web`; verify all backend and frontend tests pass.
- [x] 3.2 Run `dotnet build Poqr.sln` and `npm run build` from `src/Poqr.Web`; verify both production builds succeed.
- [x] 3.3 Run `npm run test:e2e` to verify two-tab propagation, repeated activations, active/revealed rounds, and rejoining without historical activations; verify backend hub tests cover session isolation.
