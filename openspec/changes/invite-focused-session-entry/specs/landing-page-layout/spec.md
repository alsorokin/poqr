# Spec Delta

## MODIFIED Requirements

### Requirement: Aligned session entry controls
When no invitation is active, the landing page SHALL display two side-by-side entry rows on viewports that support them: Create before the participant-name input and Join after the session-code input. When an invitation is active, the landing page SHALL instead display the invitation-focused entry controls.

#### Scenario: Choosing an entry path on a wide viewport
- **WHEN** a user views the landing page without an active invitation at a viewport width that supports the side-by-side join layout
- **THEN** the Create action and participant-name input share one aligned row, and the session-code input and Join action share a second aligned row

### Requirement: Clear and accessible session entry paths
When no invitation is active, the landing page SHALL present creating a session and joining an existing session as visually distinct actions using contextual row headings, concise Create and Join action text, input hints, and programmatic input labels. When an invitation is active, joining that session SHALL be the only primary entry action, with creation available through a secondary escape action.

#### Scenario: Selecting an entry path
- **WHEN** a user views the landing page without an active invitation
- **THEN** they can distinguish the create-session action from the join-existing-session action and identify the participant-name and session-code inputs without losing access to either

#### Scenario: Opening an invitation
- **WHEN** a user opens the landing page with an active invitation
- **THEN** the page presents joining the invited session rather than the normal pair of create/join paths

### Requirement: Responsive landing controls
The landing page SHALL keep every entry control usable at narrow viewport widths by adapting its layout without horizontal overflow.

#### Scenario: Viewing on a narrow viewport
- **WHEN** a user opens the landing page without an active invitation on a narrow viewport
- **THEN** the name field, session-code field, and both actions remain readable, reachable, and contained within the page

#### Scenario: Viewing an invitation on a narrow viewport
- **WHEN** a user opens an invitation on a narrow viewport
- **THEN** the session heading, name field, Join session action, and secondary escape action remain readable, reachable, and contained within the page

## ADDED Requirements

### Requirement: Invitation-focused entry
Opening the landing page with a nonblank `session` query parameter SHALL activate invitation entry, trimming surrounding whitespace and displaying the code in uppercase. Missing, empty, or whitespace-only values SHALL use normal entry. Invitation entry SHALL display a "Join session <code>" heading, the code as noneditable context rather than a session-code input, a visibly and programmatically labeled "Your name" field, and one primary "Join session" action. The page SHALL NOT claim the session exists before a successful join.

#### Scenario: Opening a shared session link
- **WHEN** a user opens `/?session=7ugpct`
- **THEN** the heading reads "Join session 7UGPCT", the name field and primary Join session action are shown, and the normal Create action and editable session-code field are absent

#### Scenario: Opening without a usable invitation
- **WHEN** a user opens the page with no session parameter or with an empty or whitespace-only session value
- **THEN** the normal create/join landing page is shown

#### Scenario: Normalizing an invitation code
- **WHEN** a user opens the page with a session parameter containing surrounding whitespace and lowercase letters
- **THEN** the displayed and submitted invitation code is trimmed and uppercased

### Requirement: Explicit invitation submission
Invitation entry SHALL restore the last remembered participant name when available and allow editing it. Joining SHALL require a nonblank name and an explicit Join session activation or Enter submission from the name field. Both submission methods SHALL use the same existing join and participant-recovery behavior. Merely opening the invitation SHALL NOT create or join a session.

#### Scenario: Confirming a remembered name
- **WHEN** a user with a remembered name opens an invitation
- **THEN** the name is prefilled and editable, and no join or create request occurs until explicit submission

#### Scenario: Submitting by keyboard
- **WHEN** a user enters a nonblank name in invitation entry and presses Enter in that field
- **THEN** the application submits a join for the displayed session using the same behavior as the Join session button, without creating a session

#### Scenario: Rejecting a blank name
- **WHEN** the invitation name field is empty or whitespace-only
- **THEN** the Join session action is disabled and Enter does not submit a join

#### Scenario: Completing a join
- **WHEN** an invitation join succeeds
- **THEN** the existing in-room screen and real-time connection behavior are used

### Requirement: Invitation escape and failure recovery
Invitation entry SHALL provide a visually secondary "Start a different session" action. Activating it SHALL remove the session query parameter while preserving other URL components, clear the invitation code and entry error, retain the entered name, and show the normal create/join landing page without creating a session or deleting remembered participant identities. Failed joins SHALL preserve the invitation and name, display an accessible error, and allow retry or escape without automatically creating a session.

#### Scenario: Choosing a different session
- **WHEN** an invitee activates "Start a different session"
- **THEN** the normal create/join screen appears with the name retained and session-code field empty, the session parameter is removed, and no create or join request is made

#### Scenario: Reloading after escape
- **WHEN** a user reloads after leaving invitation entry through the secondary action
- **THEN** the page remains in normal entry because the invitation parameter has been removed

#### Scenario: Joining a missing session or encountering a request failure
- **WHEN** an invitation join fails, including for an invalid or expired session
- **THEN** an accessible join error appears, the invitation code and entered name remain available, and the user can retry or choose a different session without an automatic create request
