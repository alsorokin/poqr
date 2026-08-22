## 1. Real-time logo contract

- [x] 1.1 Add the `ActivateCinemaLogo` hub method that resolves the caller from its registered connection and broadcasts the additive `CinemaLogoActivated` event only to that session; verify valid activations reach the room group and unregistered or stale callers are not broadcast.
- [x] 1.2 Add backend coverage for room scoping, invalid/stale connection rejection, repeated activation forwarding, and activation during active and revealed rounds; verify the focused xUnit tests pass.
- [x] 1.3 Add the optional cinema-logo fruit payload, selecting an eligible participant and fruit from the current unrevealed round without mutating `RoomStore`; verify focused hub tests cover each payload field and no-payload cases.
- [x] 1.4 Extend backend hub coverage for all-voted, revealed, absent, stale, and disconnected-target cases; verify payload selection never changes votes or round state.

## 2. Client behavior and visual identity

- [x] 2.1 Extend `PokerClientService` with the `ActivateCinemaLogo` invocation and `CinemaLogoActivated` observable, including reconnect-compatible event handling; verify Angular service tests cover invoking and receiving the event.
- [x] 2.2 Add the shared `✋🗿✋` and `Poqr` logo to the landing panel and in-room header, mirroring one inline upright hand with CSS and exposing one accessible "Pure cinema" label; make the room version an accessible clickable control and verify Angular component tests cover both views and logo activation.
- [x] 2.3 Add the tilted landing entrance and room activation CSS animations, a restart mechanism that handles every received event, reduced-motion handling, and narrow-layout header styling; verify Angular tests and manual narrow-viewport inspection show no overlap, horizontal overflow, or loss of the mirrored-hand treatment.
- [x] 2.4 Synchronize the optional C# cinema-logo event envelope with its TypeScript type and client observable; verify Angular service tests cover payload and payload-free events.
- [x] 2.5 Render the active-round fruit flight and explosion overlay from the in-room cinema logo to the selected participant row, with no overlay for payload-free activations or a missing target; verify Angular component tests cover origin, target selection, and cleanup.

## 3. Validation

- [x] 3.1 Run `dotnet test` from `src/Poqr.Api.Tests` and `npm run test` from `src/Poqr.Web`; verify all backend and frontend tests pass.
- [x] 3.2 Run `dotnet build Poqr.sln` and `npm run build` from `src/Poqr.Web`; verify both production builds succeed.
- [x] 3.3 Run `npm run test:e2e` to verify two-tab propagation, repeated activations, active/revealed rounds, and rejoining without historical activations; verify backend hub tests cover session isolation.
- [x] 3.4 Extend `npm run test:e2e` to verify the shared fruit target and logo origin during an active round and its absence after every participant has voted or the round is revealed; verify the scenario passes.
