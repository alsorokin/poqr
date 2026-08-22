## Context

See `proposal.md` for motivation. The Angular root component currently renders
both the landing and room views; its `PokerClientService` already translates
SignalR events into client observables. `PokerHub` owns transient connection
membership and broadcasts room events, while `RoomStore` owns persistent-in-room
business state and round invariants.

## Goals / Non-Goals

**Goals:**

- Use a mirrored pair of upright `✋` hands around the moai as a recognizable logo.
- Make the room interaction immediate, room-scoped, and repeatable for every
  valid click.
- Keep the visual identity usable on desktop and narrow layouts.

**Non-Goals:**

- Store an activation in `RoomStore`, include it in `RoomStateDto`, or replay it
  after a join/reconnect.
- Change the REST API, session lifecycle, participant membership, or round
  authority.
- Add animation assets or a frontend animation dependency.

## Decisions

### Use one CSS/text logo component within the root template

The landing and room views will share markup/classes for the `✋🗿✋` emoji mark
and `Poqr` wordmark. One `✋` is wrapped in an inline element and mirrored with
`scaleX(-1)` so both hands remain upright while appearing as opposite hands.
The combined wordmark has one accessible "Pure cinema" label, and its
decorative emoji spans are hidden from assistive technology. The landing
instance receives a one-time tilted entrance animation; the room instance is an
accessible button placed in the room header. CSS media queries will
resize/reflow the header rather than fixing the control to the viewport,
preventing overlap with session details and Leave.

CSS keyframes avoid a new runtime dependency and allow `prefers-reduced-motion`
to suppress the landing entrance motion. The exact theatrical motion styling is
an implementation choice as long as every activation visibly restarts the
in-room animation.

### Send a transient SignalR activation event

`PokerHub` will expose an `ActivateCinemaLogo` hub method with no client-supplied
session or participant identifiers. It will resolve the caller from its existing
`ConnectionMap`; an absent or stale mapping is rejected without a group
broadcast. A valid call sends `CinemaLogoActivated` to the caller's session
group. The event has no payload because the recipient needs only a trigger.

`PokerClientService` will invoke `ActivateCinemaLogo`, subscribe to
`CinemaLogoActivated`, and expose a transient observable to `App`. `App` will
use an incrementing animation key/state to restart its CSS animation for every
event, including events arriving before a previous animation ends.

This avoids allowing a client to name another session, avoids a `RoomStore`
mutation for a non-business interaction, and keeps the event ephemeral.
The alternative—adding an activation counter to `RoomStateDto`—would replay
stale animation state on every room update and couple a visual fidget to the
authoritative game state.

### Keep contract additions minimal and synchronized

The affected SignalR contract consists of hub method `ActivateCinemaLogo` and
server event `CinemaLogoActivated`. No REST routes or C# command/envelope
records in `Contracts/PokerContracts.cs` are required because caller identity is
derived from the hub connection and the event has no payload. TypeScript adds
the corresponding invocation and event observable in
`poker-client.service.ts`; no `poker.types.ts` record is required.

`PokerHub` remains authoritative for transient connection-scoped delivery.
`RoomStore` remains authoritative for room and round business invariants and is
intentionally not changed.

## Risks / Trade-offs

- **Unlimited clicks can create noisy or visually chaotic rooms** → This is an
  explicit product decision; every valid activation is forwarded without
  throttling.
- **A reconnecting client can miss activations while disconnected** → Events are
  intentionally not persisted or replayed; subsequent events arrive after the
  normal rejoin flow completes.
- **Rapid DOM animation restarts can be inconsistent if only a CSS class is
  toggled** → Use a monotonically changing render key or equivalent DOM
  replacement so every received event visibly restarts the animation.
- **Emoji glyphs vary by platform** → Use the existing text emoji representation
  rather than claiming pixel-identical artwork across platforms.

## Migration Plan

Deploy frontend and backend together so the new UI has a matching hub handler.
Older clients remain functional because the new server event is additive; a
newer client connected to an older server receives a failed invocation but does
not affect voting. Rollback removes the additive handler and returns the UI to
the prior static layout; no persisted data or migration is involved.
