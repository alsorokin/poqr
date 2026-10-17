# Tasks

## 1. Frontend entry state and presentation

- [x] 1.1 Add explicit invitation context in App from the trimmed, uppercased session query parameter, treating blank values as normal entry; verify Angular tests cover missing, empty, whitespace-only, lowercase, and padded values and show no automatic create/join requests.
- [x] 1.2 Render the invitation heading, visible name label, noneditable code, single primary Join session form, and secondary escape using existing styles; verify Angular DOM assertions distinguish both entry modes and the unchanged normal create/join layout.
- [x] 1.3 Route invitation button and Enter submission through the existing join/participant-recovery path with a nonblank-name guard; verify Angular tests cover remembered and edited names, remembered participant identities, both submission methods, blank-name rejection, and successful connection without creation.
- [x] 1.4 Implement escape by clearing invitation context, session input, and error and removing only the session URL parameter while retaining name and storage; verify Angular tests cover unrelated URL parameters/fragments, reload, no network requests, and invited-room reset behavior.
- [x] 1.5 Keep failed joins in invitation entry with an accessible error and retry/escape available; verify Angular tests use a failed join response and confirm the name/code remain and no replacement session is created.

## 2. Browser coverage

- [x] 2.1 Add or adapt an existing E2E scenario so a host creates a room and an invitee opens the share URL, sees the join-focused form, submits it, and appears in the host's room; verify the browser scenario also checks narrow-width containment and escape back to normal entry, and update existing invite-link selectors if needed.

## 3. Documentation

- [x] 3.1 Update README.md to explain that shared session links open a join-focused screen and creation remains available through "Start a different session"; verify the text matches the implemented UI, updating AGENTS.md only if commands or agent workflow actually change.

## 4. Integration validation

- [x] 4.1 Run `cd src/Poqr.Web && npm run test` and `cd src/Poqr.Web && npm run build`, plus `dotnet build Poqr.sln` per repository handoff requirements; verify all pass and normal-entry/room regression coverage remains intact.
- [x] 4.2 Run `cd src/Poqr.Web && npm run test:e2e` and manually verify the invite journey in two browser tabs, including keyboard submission, a failed join, and escape; verify invitees reach the host's existing session rather than creating a separate room and record any validation blockers.
