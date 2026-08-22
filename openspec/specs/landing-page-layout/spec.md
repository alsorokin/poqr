# landing-page-layout Specification

## Purpose

Provide a clear, aligned, and responsive entry page for planning-poker sessions.

## Requirements

### Requirement: Aligned session entry controls
The landing page SHALL display two side-by-side entry rows on viewports that support them: Create before the participant-name input and Join after the session-code input.

#### Scenario: Choosing an entry path on a wide viewport
- **WHEN** a user views the landing page at a viewport width that supports the side-by-side join layout
- **THEN** the Create action and participant-name input share one aligned row, and the session-code input and Join action share a second aligned row

### Requirement: Clear and accessible session entry paths
The landing page SHALL present creating a session and joining an existing session as visually distinct actions using contextual row headings, concise Create and Join action text, input hints, and programmatic input labels.

#### Scenario: Selecting an entry path
- **WHEN** a user views the landing page
- **THEN** they can distinguish the create-session action from the join-existing-session action and identify the participant-name and session-code inputs without losing access to either

### Requirement: Responsive landing controls
The landing page SHALL keep every entry control usable at narrow viewport widths by adapting its layout without horizontal overflow.

#### Scenario: Viewing on a narrow viewport
- **WHEN** a user opens the landing page on a narrow viewport
- **THEN** the name field, session-code field, and both actions remain readable, reachable, and contained within the page

### Requirement: Responsive logo placement
The landing and in-room cinema logos SHALL remain visible, reachable where
interactive, and contained without overlapping session controls at narrow
viewport widths.

#### Scenario: Viewing the landing page on a narrow viewport
- **WHEN** a user opens the landing page on a narrow viewport
- **THEN** the cinema logo and all session-entry controls remain readable, reachable, and contained within the page

#### Scenario: Viewing a room on a narrow viewport
- **WHEN** a user opens a joined session on a narrow viewport
- **THEN** the interactive cinema logo, session details, and Leave action remain visible and reachable without overlap
