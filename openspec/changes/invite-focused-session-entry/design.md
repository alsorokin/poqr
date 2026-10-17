# Design

## Context

See proposal.md for motivation. `App.ngOnInit` currently copies the URL's session parameter into `sessionInput`; `app.html` always renders both entry paths. `participantName` is shared by creation and joining but visually belongs to creation. `joinSession` already recovers a participant identity from session storage, and `handleJoined` updates the URL and connects SignalR.

A small design is warranted to settle entry-state ownership and URL/reset behavior before coding. The URL also records successfully joined sessions; it is not proof that a room exists.

## Goals / Non-Goals

**Goals:** Keep presentation state local to App, use the existing join path, and make the invitation escape survive reload without disturbing remembered identities.

**Non-Goals:** No new route, service, dependency, preflight request, or server validation rule. Do not change room membership, reconnect handling, normal-entry keyboard behavior, or room lifecycle.

## Decisions

### Model invitation context separately from editable normal entry

Use a nullable invitation code in App, initialized from the first session query parameter after trimming and uppercasing. Empty values mean normal entry. Do not infer invitation mode from `sessionInput`: normal-entry users type into that field, and successful joins also populate it.

Use the normalized invitation code as the join target while invitation mode is active, through the existing `joinSession` method and service call. Keep existing participant recovery and `handleJoined` behavior. Presentation and entry validation belong to App; RoomStore remains authoritative for session existence and room business invariants.

Alternative: merely reorder or recolor the existing paths. Rejected because it retains competing primary actions and the misleading name-field grouping.

### Render one invitation form with a deliberate escape

Keep the existing branding. Replace the two normal entry paths only in invitation mode with:

```text
Join session 7UGPCT

Your name
[ remembered or entered name ]
[       Join session        ]

Start a different session
```

Use a real form with one submit handler, a submit button, and a visible name label. Enforce a nonblank trimmed name in the submission path as well as the disabled button so keyboard submission cannot bypass the guard. Render the secondary escape as a non-submit, low-emphasis button. Reuse existing styling and responsive conventions. Announce invitation errors using an appropriate alert/live region.

Alternative: automatically join when a remembered name exists. Rejected because names may be stale and opening a link should not silently add membership.

### Clear invitation context and URL together on escape

The escape clears the invitation code, `sessionInput`, and entry error, while retaining `participantName` and storage. Remove only the session query parameter with the URL API and replace the current history entry, preserving unrelated parameters and the fragment. It must not call creation or joining.

Preserve invitation context during failed joins, successful room entry, and existing room reset paths. Thus leaving an invited room returns to its join screen with the existing URL; the explicit escape remains available. Normal-entry visits stay normal within the current page lifecycle; refreshing a joined session URL opens invitation entry. Do not derive the landing mode from the nonempty session input after reset.

Alternative: change only an in-memory visibility flag on escape. Rejected because reload would restore the invitation.

### Reuse join errors and server validation

Keep the existing join-failure message and allow retry or escape. Do not assert that a room exists, issue a preflight GET, classify all join errors as expiry, or fall back to creation. REST routes, SignalR methods/events, and C#/TypeScript payload types are unchanged.

### Cover presentation and the actual invite journey

Angular tests cover URL normalization, blank values, conditional controls, remembered/editable names, button and Enter submission, blank-name rejection, participant recovery, failure retention, escape URL semantics, and room reset behavior.

Add a browser scenario using the existing E2E harness: a host creates a room, an invitee opens its share URL, sees only the join-focused controls, joins, and appears in the host's room. Check the invitation layout at a narrow width and the escape back to normal entry. This verifies entry wiring without changing real-time semantics.

## Risks / Trade-offs

- [An invitation may reference a missing or expired room] -> Submit to the existing join endpoint; retain context and display an error without claiming the room is active.
- [A conditional form could break name binding or submit twice] -> Use one submit path and test actual button and keyboard interactions.
- [URL and local invitation state could diverge] -> Clear both in the explicit escape; cover reload and reset behavior.
- [Hiding creation adds a click for invitees who intentionally want a new room] -> Keep a visible secondary escape rather than removing access.

## Migration Plan

Deploy through the existing release process; no backend, storage, Bicep, or GitHub Actions migration is needed. Existing share URLs remain compatible. Rollback restores the former landing presentation without changing room data or contracts.
