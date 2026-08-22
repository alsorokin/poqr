## 1. Concurrent fruit effects

- [ ] 1.1 Replace the singleton fruit overlay state with independent effect instances that retain their own geometry and timers; verify each received activation creates a distinct instance without mutating active instances.
- [ ] 1.2 Render and clean up each fruit instance independently through its flight and explosion lifecycle; verify Angular component tests cover overlapping effects, per-effect explosions, cleanup, and component teardown.

## 2. Validation

- [ ] 2.1 Extend the cinema-logo E2E scenario to trigger rapid active-round activations and verify multiple fruit overlays retain their identities through completion; verify `npm run test:e2e` passes.
- [ ] 2.2 Run `npm run test` and `npm run build` from `src/Poqr.Web`; verify the frontend tests and production build pass.
