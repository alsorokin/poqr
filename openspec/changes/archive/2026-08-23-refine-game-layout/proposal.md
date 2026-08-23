## Why

The in-session header uses a separate, text-heavy share-link row that does not
align with the Poqr brand or Leave action. At narrow widths, the multi-emoji
Joker label can also split across lines, weakening the card grid's visual
stability.

## What Changes

- Place the session identifier in the same vertically aligned header row as the
  Poqr logo and Leave action.
- Replace the displayed share-link text and URL with an accessible compact copy
  button next to the session identifier.
- Keep the Joker emoji mark together inside its voting card at narrow widths.

## Capabilities

### New Capabilities
- `game-room-layout`: Responsive and accessible layout requirements for the
  joined-session header, session-link copy action, and voting-card labels.

### Modified Capabilities

- None.

## Impact

- **Frontend:** Angular room template, component copy-to-clipboard behavior,
  styles, and corresponding frontend tests/e2e coverage.
- **Backend/shared contracts/infrastructure/documentation:** No changes.
- **Non-goals:** Changing session URLs, room-state behavior, authentication,
  persistence, or multi-instance support.
