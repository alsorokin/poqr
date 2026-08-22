# product-branding Specification

## Purpose

Present one concise Poqr identity wherever people encounter the web application
or its browser-provided metadata, while retaining its planning-poker purpose.

## Requirements

### Requirement: Consistent Poqr product identity
The application SHALL identify itself as `Poqr` in its visible landing-page
brand, browser title and description metadata, and end-user documentation,
while retaining its planning-poker purpose. The visible landing-page brand and
in-room header SHALL include the `✋🗿✋` cinema-emoji logo, with one upright
hand visually mirrored and the combined mark labeled accessibly as "Pure cinema".

#### Scenario: Opening the application
- **WHEN** a user loads the application entry page
- **THEN** the visible product brand includes `Poqr` and the `✋🗿✋` cinema-emoji logo with its mirrored hand, and the browser title identifies the application as `Poqr`

#### Scenario: Joining a session
- **WHEN** a user has joined a planning-poker session
- **THEN** the room header displays the `✋🗿✋` cinema-emoji logo with its mirrored hand as part of the Poqr identity

#### Scenario: Discovering the project documentation
- **WHEN** a user reads the repository documentation
- **THEN** it identifies the product as `Poqr` while accurately describing its planning-poker functionality
