## Purpose

Let connected planning-poker participants share an unrestricted, playful cinema
logo animation without changing room state or voting behavior.

## ADDED Requirements

### Requirement: Room-wide cinema logo activation
The application SHALL let each connected participant activate the interactive
cinema logo and SHALL trigger its animation for every participant currently
connected to the same session.

#### Scenario: Participant activates the logo
- **WHEN** a connected participant activates the in-room cinema logo
- **THEN** every connected client in that participant's session starts one logo animation

#### Scenario: Other sessions remain unaffected
- **WHEN** a participant activates the cinema logo in a session
- **THEN** clients connected only to other sessions do not receive or display that activation

### Requirement: Unrestricted activation during a session
The application SHALL accept each valid logo activation immediately, without a
cooldown, debounce, queue, suppression, or dependence on round state.

#### Scenario: Repeated activations
- **WHEN** a participant activates the logo repeatedly, including while an earlier logo animation is running
- **THEN** the application broadcasts and displays an activation for every click

#### Scenario: Activation during voting or reveal
- **WHEN** a participant activates the logo during an active or revealed round
- **THEN** the activation is displayed without changing votes, round state, or reveal state

### Requirement: Valid active-session activation
The application SHALL accept a logo activation only from a client whose current
connection belongs to an existing session participant, and SHALL not broadcast
an invalid or stale activation.

#### Scenario: Stale or unjoined client activates the logo
- **WHEN** a client without a current registered session membership activates the logo
- **THEN** the application does not broadcast an animation to any session

#### Scenario: Participant reconnects
- **WHEN** a participant reconnects and rejoins their session
- **THEN** they can activate and receive subsequent logo animations without receiving historical activations
