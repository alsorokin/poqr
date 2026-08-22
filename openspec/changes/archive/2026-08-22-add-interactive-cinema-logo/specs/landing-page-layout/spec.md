## ADDED Requirements

### Requirement: Animated landing cinema logo
The landing page SHALL display a visibly tilted `✋🗿✋` cinema-emoji logo with
one upright hand visually mirrored and a one-time entrance animation when the
page loads.

#### Scenario: Opening the landing page
- **WHEN** a user opens the landing page
- **THEN** the tilted mirrored-hand cinema logo performs its entrance animation once before remaining visible

#### Scenario: Reduced-motion preference
- **WHEN** a user has enabled a reduced-motion preference
- **THEN** the landing logo remains visible without non-essential entrance motion

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
