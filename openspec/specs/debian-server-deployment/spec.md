# debian-server-deployment Specification

## Purpose

Provide a reliable HTTPS deployment path for the single-instance Poqr application on a Debian server while preserving its anonymous real-time gameplay.

## Requirements

### Requirement: Secure public application endpoint
The system SHALL serve Poqr at `poqr.snay.am` over HTTPS and redirect HTTP
requests to the equivalent HTTPS URL. The endpoint SHALL continue serving the
SPA, REST API, and SignalR hub from one origin.

#### Scenario: Secure browser access
- **WHEN** a browser requests `poqr.snay.am` over HTTP
- **THEN** it is redirected to the equivalent HTTPS URL

#### Scenario: Application availability
- **WHEN** a browser requests `https://poqr.snay.am`
- **THEN** it receives the Poqr SPA and the API status endpoint responds
  successfully

### Requirement: Real-time connectivity through the public endpoint
The public deployment SHALL preserve SignalR WebSocket connectivity at `/hubs/poker` so that participants can join, reconnect, and receive room updates using the same real-time behavior as the existing deployment.

#### Scenario: WebSocket upgrade
- **WHEN** a browser connects to `/hubs/poker` through the public HTTPS hostname
- **THEN** the connection upgrades to WebSockets and receives room updates

#### Scenario: Temporary client disconnect
- **WHEN** a connected participant temporarily loses and restores network connectivity
- **THEN** the existing reconnect and membership lifecycle behavior remains unchanged

### Requirement: Versioned and recoverable releases
Each deployment SHALL install a versioned application release and verify its health before it is considered successful. An operator SHALL be able to restore the immediately preceding healthy release without rebuilding the application.

#### Scenario: Successful release
- **WHEN** a valid deployment artifact is activated
- **THEN** the active service starts the new release and the public status endpoint passes a health check

#### Scenario: Failed release
- **WHEN** activation or the post-deployment health check fails
- **THEN** the previously healthy release remains available or is restored and the deployment reports failure

### Requirement: Separated deployment access
Interactive server administration and continuous deployment SHALL use separate SSH identities. The continuous-deployment identity SHALL be limited to deployment operations and SHALL not be required to use the administrator's passphrase-protected private key.

#### Scenario: CI credential use
- **WHEN** the continuous deployment workflow deploys a release
- **THEN** it authenticates with its dedicated SSH key and does not access the interactive administrator key

### Requirement: Compatible production origins and telemetry
The production backend SHALL accept browser API and SignalR requests from
`https://poqr.azurewebsites.net` and `https://poqr.snay.am`, and SHALL not
include `https://poqr.snay.me` in its CORS policy. When an Application
Insights connection string is configured, the Debian deployment SHALL send
application telemetry to that resource.

#### Scenario: Existing Azure origin remains compatible
- **WHEN** a browser application is served from `https://poqr.azurewebsites.net`
- **THEN** its API and SignalR requests are accepted by the production CORS
  policy

#### Scenario: Canonical Debian origin is compatible
- **WHEN** a browser application is served from `https://poqr.snay.am`
- **THEN** its API and SignalR requests are accepted by the production CORS
  policy

#### Scenario: Legacy origin is not compatible
- **WHEN** a browser application is served from `https://poqr.snay.me`
- **THEN** `https://poqr.snay.me` is absent from the production CORS policy

#### Scenario: Telemetry is configured
- **WHEN** the Debian service has an Application Insights connection string
- **THEN** its application telemetry is sent using that connection string
