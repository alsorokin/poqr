## Why

Poqr has no distinctive in-app visual identity beyond its name, leaving idle
participants with nothing playful to do while they wait for a vote. A shared
"pure cinema" logo makes the product recognizable and adds a deliberately
lightweight room interaction without changing planning-poker rules.

## What Changes

- Display a compact `✋🗿✋` Poqr logo on the landing page and in the room header,
  with one upright hand visually mirrored and the combined mark labeled
  accessibly as "Pure cinema".
- Give the landing logo a tilted, one-time entrance animation while honoring
  reduced-motion preferences.
- Make the in-room logo clickable; every click triggers the logo animation for
  all connected participants in that room.
- Deliver every valid click immediately, with no cooldown, debounce, queue, or
  suppression, including while a round is active or revealed.
- Keep logo placement and session controls usable on narrow viewports.

## Capabilities

### New Capabilities

- `cinema-logo-interaction`: Room-scoped, real-time activation of the interactive
  cinema logo.

### Modified Capabilities

- `product-branding`: Extend the visible Poqr identity with the cinema-emoji logo.
- `landing-page-layout`: Add the animated logo while preserving a responsive,
  usable session entry page.

## Impact

- **Frontend:** Angular root template, component state, styles, and frontend tests.
- **Backend:** `PokerHub` gains a room-scoped logo-activation method and broadcast;
  no `RoomStore` state change is needed.
- **Shared contracts:** New SignalR method/event names and their TypeScript handler
  must stay synchronized; no REST route changes.
- **Infrastructure:** No change; the existing single-instance WebSocket-enabled
  SignalR deployment remains sufficient.
- **Documentation:** No change expected.

## Intentional Non-Goals

- Persisting logo activations, animation history, or user interaction metrics.
- Adding authentication, authorization, moderation, or per-user rate limits.
- Supporting multi-instance room synchronization or a SignalR backplane.
- Changing card values, voting, reveal, or session lifecycle behavior.
