## Why

The initial session-entry page has visibly misaligned join controls because the shared label spacing interacts with its flex layout. Its wide, undifferentiated form also makes the two entry paths harder to scan, especially on smaller screens.

## What Changes

- Align each session-entry input with its related action on wider screens, placing Create before the name input and Join after the session-code input.
- Constrain and organize the landing form so creating and joining a session are distinct, readable paths with concise action text.
- Replace visible field labels with contextual row headings and input hints while retaining accessible names.
- Make the landing controls adapt to narrow viewports without clipping or awkward wrapping.

## Capabilities

### New Capabilities

- `landing-page-layout`: Provide an aligned, responsive initial page for creating or joining a planning-poker session.

### Modified Capabilities

- None.

## Impact

- Affects the Angular root component template and stylesheet under `src/Poker.Web/src/app/`.
- Adds focused frontend rendering/layout coverage; no API, SignalR contract, dependency, or backend changes.
