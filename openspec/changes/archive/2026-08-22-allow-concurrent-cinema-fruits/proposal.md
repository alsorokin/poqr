## Why

Rapid cinema-logo activations currently replace the in-progress fruit overlay,
making a fruit appear to change mid-flight. The logo is intentionally
unrestricted, so every valid activation needs an independent visual lifecycle.

## What Changes

- Render a separate fruit flight and explosion for every active fruit effect.
- Preserve every received fruit's identity, target, logo origin, and timing
  until its own effect completes.
- Keep effects transient and local to each connected client; no room-state or
  SignalR contract changes are required.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cinema-logo-interaction`: Allow overlapping active-round fruit effects for
  rapid logo activations without replacing existing effects.

## Impact

- **Frontend:** Angular fruit-effect state, overlay rendering, cleanup timers,
  unit tests, and the cinema-logo browser E2E scenario.
- **Backend/shared contracts:** No change; the existing transient fruit event
  continues to select the shared fruit and target.
- **Infrastructure/documentation:** No change.

## Intentional Non-Goals

- Capping, queuing, or persisting fruit effects.
- Changing activation delivery, round state, voting, or participant targeting.
