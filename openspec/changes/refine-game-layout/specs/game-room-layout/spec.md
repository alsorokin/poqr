## Purpose

Provide a compact, accessible, and resilient layout for active planning-poker
sessions across both standard and constrained viewport widths.

## ADDED Requirements

### Requirement: Compact aligned room header
When a user has joined a session, the application SHALL display the Poqr
identity, `Session <session identifier>` label, and Leave control in one
vertically aligned room-header row. The session identifier SHALL remain visible
and the header controls SHALL remain reachable and contained without overlap at
narrow viewport widths.

#### Scenario: Viewing an active session
- **WHEN** a user opens a joined planning-poker session
- **THEN** the Poqr identity, session label, and Leave control appear in the
  same vertically aligned header row

#### Scenario: Viewing an active session on a narrow viewport
- **WHEN** a user views a joined planning-poker session at a constrained width
- **THEN** the room-header identity, session label, and Leave control remain
  visible, reachable, and contained without overlap

### Requirement: Copyable session link
The room header SHALL provide a compact copy control directly beside the
session label instead of rendering the share-link text or URL. The control
SHALL use a copy symbol and an accessible name that identifies its purpose.
Activating it SHALL copy the session's canonical share URL, including its
session query parameter, to the user's clipboard.

#### Scenario: Copying an active session link
- **WHEN** a user activates the copy-session-link control
- **THEN** the canonical URL for the current session is copied to the
  clipboard

#### Scenario: Accessing the copy control with assistive technology
- **WHEN** a user navigates the active-session header with assistive technology
- **THEN** the compact copy-symbol control exposes an accessible name that
  identifies it as copying the session link

### Requirement: Unwrapped Joker card label
The voting-card label for the Joker value SHALL render its complete
cinema-emoji mark as a single unwrapped unit. This requirement SHALL hold at
narrow viewport widths while preserving the card's containment in the voting
grid.

#### Scenario: Selecting the Joker card on a narrow viewport
- **WHEN** an active vote displays the Joker card at a constrained width
- **THEN** its complete cinema-emoji mark remains on one line within the card
  and does not wrap between emoji
