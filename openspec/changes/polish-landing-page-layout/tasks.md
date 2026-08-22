## 1. Landing page structure and styling

- [x] 1.1 Organize the create-session and join-session controls into visually distinct landing-page paths while preserving their existing bindings and disabled states; verify both actions still invoke their current flows.
- [x] 1.2 Update the landing-page CSS so the session-code field and Join session button align on wide viewports, and controls remain contained and usable on narrow viewports; verify at desktop and mobile viewport widths.

## 2. Frontend validation

- [x] 2.1 Add or update focused Angular rendering tests for the landing-page grouping and controls, then verify `cd src/Poker.Web && npm run test` passes.
- [x] 2.2 Build the frontend and verify `cd src/Poker.Web && npm run build` completes successfully.

## 3. Mirrored entry rows

- [x] 3.1 Rework the landing-page rows so Create precedes the participant-name input and Join follows the session-code input; use contextual headings, visually hidden labels, and input hints while preserving existing bindings and disabled states; verify desktop and mobile layouts.
- [x] 3.2 Change the action text to Create and Join, add focused rendering and accessibility coverage, then verify `cd src/Poker.Web && npm run test` and `cd src/Poker.Web && npm run build` pass.

## 4. Narrow viewport correction

- [x] 4.1 Use the dynamic viewport height for the landing page and give narrow-screen entry inputs a 48px minimum height; verify that a mobile browser viewport has no persistent vertical scrollbar and that both inputs remain comfortably tappable.

## 5. Narrow viewport refinement

- [x] 5.1 Make the mobile entry inputs match the button height and render the Angular root as a block so the full-height page does not create inline-root overflow; verify that the landing page has no persistent vertical scrollbar in a mobile browser viewport.
