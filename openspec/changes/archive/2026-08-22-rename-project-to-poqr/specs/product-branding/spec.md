## Purpose

Present one concise Poqr identity wherever people encounter the web application
or its browser-provided metadata, while retaining its planning-poker purpose.

## ADDED Requirements

### Requirement: Consistent Poqr product identity
The application SHALL identify itself as `Poqr` in its visible landing-page
brand, browser title and description metadata, and end-user documentation.

#### Scenario: Opening the application
- **WHEN** a user loads the application entry page
- **THEN** the visible product brand and browser title identify the application as `Poqr`

#### Scenario: Discovering the project documentation
- **WHEN** a user reads the repository documentation
- **THEN** it identifies the product as `Poqr` while accurately describing its planning-poker functionality
