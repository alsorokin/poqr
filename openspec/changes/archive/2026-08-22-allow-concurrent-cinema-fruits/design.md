## Context

The root Angular component currently stores one fruit effect and clears its
timers before showing the next one. See `proposal.md` for motivation and the
cinema-logo interaction spec for required behavior.

## Goals / Non-Goals

**Goals:**

- Preserve every fruit activation's independent flight, explosion, and cleanup.
- Keep the existing server-selected fruit and target shared across room clients.

**Non-Goals:**

- Change the SignalR event payload or `RoomStore`.
- Limit, persist, or coordinate visual effects across browser clients.

## Decisions

### Represent each active fruit as an independent client-side effect

`App` will replace its singleton fruit state and timers with a collection of
effect instances, each identified locally and containing its fruit, positions,
explosion state, and cleanup timers. The template will render one overlay per
instance with a stable identity.

This prevents a later event from clearing or mutating an earlier overlay. A
single reusable overlay was rejected because it cannot preserve overlapping
animation state.

### Resolve geometry once per received event

Each new instance captures the current cinema-logo and target-row centers before
rendering. Its start and target coordinates remain fixed for its lifetime, so
layout changes or later events cannot redirect it.

## Risks / Trade-offs

- Unrestricted activations can create many simultaneous overlays → This matches
  the existing unrestricted-logo interaction; each effect removes itself after
  its current short lifecycle.
- Timers can outlive a component instance → Clear every active effect's timers
  during teardown and when leaving the room.

## Migration Plan

Deploy as a frontend-only compatible change. Rollback restores the singleton
overlay behavior; no persisted data or contract migration is involved.
