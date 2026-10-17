# Proposal

## Why

Invite links currently open a create-first landing page with only the session code prefilled. The name field appears under creation even though joining also requires it, encouraging invitees to create a separate session accidentally.

## What Changes

- Show a join-focused entry screen when the URL contains a nonblank session parameter.
- Display the invitation's session code as context, a visibly labeled name field, and one primary "Join session" action with keyboard submission.
- Preserve remembered names and participant recovery without joining automatically.
- Provide a secondary "Start a different session" action that clears the invitation and returns to the normal create/join landing page.
- Keep failed joins on the invitation screen with a visible error; never create a replacement session automatically.
- Preserve the normal landing page for visits without a session code.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `landing-page-layout`: Distinguish normal entry from invitation entry, with join-first hierarchy, accessible submission, explicit escape, and failure recovery.

## Impact

- Frontend: `src/Poqr.Web/src/app/app.ts`, `app.html`, `app.css`, and related Angular tests; browser coverage for the invitation entry path.
- Documentation: update the README's user-facing entry guidance; update AGENTS.md only if implementation changes commands or agent workflow.
- Backend, shared REST/SignalR contracts, infrastructure, and dependencies: unchanged.
- Non-goals: automatic joining, session-existence preflight, new error classification, redesigning the normal landing page, authentication, persistence, or multi-instance support. Anonymous access and ephemeral room lifecycle remain unchanged.
