## 1. Room-header interaction and layout

- [ ] 1.1 Update the joined-session template and component to replace the rendered share-link text/URL with an accessible copy-symbol button beside the session label, and verify its handler writes the canonical session URL to the clipboard.
- [ ] 1.2 Update room-header and card styles so the logo, session label/copy control, and Leave control stay vertically aligned and contained at narrow widths, and the complete Joker emoji mark cannot wrap within its card; verify the styles at desktop and constrained viewport widths.

## 2. Frontend verification

- [ ] 2.1 Add Angular tests that verify the compact session header, accessible copy control, clipboard URL, and unwrapped Joker label, then verify with `cd src/Poqr.Web && npm run test`.
- [ ] 2.2 Extend browser coverage for a joined session at a constrained viewport to verify header controls remain visible and the Joker mark remains on one line, then verify with `cd src/Poqr.Web && npm run test:e2e`.
- [ ] 2.3 Verify the production frontend bundle with `cd src/Poqr.Web && npm run build`.
