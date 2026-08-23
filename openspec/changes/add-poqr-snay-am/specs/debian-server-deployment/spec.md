## MODIFIED Requirements

### Requirement: Secure public application endpoints
During the migration period, the system SHALL serve Poqr at both
`poqr.snay.me` and `poqr.snay.am` over HTTPS and redirect HTTP requests to the
equivalent HTTPS URL. Each endpoint SHALL continue serving the SPA, REST API,
and SignalR hub from one origin. After the migration period, the system SHALL
redirect HTTPS requests for `poqr.snay.me` to the equivalent
`poqr.snay.am` URL.

#### Scenario: Secure browser access
- **WHEN** a browser requests a configured public hostname over HTTP
- **THEN** it is redirected to the equivalent HTTPS URL

#### Scenario: Application availability
- **WHEN** a browser requests a configured public hostname over HTTPS
- **THEN** it receives the Poqr SPA and the API status endpoint responds
  successfully

#### Scenario: Additional public hostname availability
- **WHEN** a browser requests `https://poqr.snay.am`
- **THEN** it receives the Poqr SPA and
  `https://poqr.snay.am/api/status` responds successfully

#### Scenario: Legacy hostname retirement
- **WHEN** the approved migration period has ended and a browser requests an
  HTTPS URL at `poqr.snay.me`
- **THEN** it is redirected to the equivalent HTTPS URL at `poqr.snay.am`

### Requirement: Compatible production origins and telemetry
During the migration period, the production backend SHALL accept browser API
and SignalR requests from `https://poqr.azurewebsites.net`,
`https://poqr.snay.me`, and `https://poqr.snay.am`. After `poqr.snay.me` is
retired, the production backend SHALL no longer include it in the production
CORS policy. When an Application Insights connection string is configured, the
Debian deployment SHALL send application telemetry to that resource.

#### Scenario: Existing Azure origin remains compatible
- **WHEN** a browser application is served from `https://poqr.azurewebsites.net`
- **THEN** its API and SignalR requests are accepted by the production CORS
  policy

#### Scenario: Debian origin is compatible
- **WHEN** a browser application is served from `https://poqr.snay.me`
- **THEN** its API and SignalR requests are accepted by the production CORS
  policy

#### Scenario: Additional Debian origin is compatible
- **WHEN** a browser application is served from `https://poqr.snay.am`
- **THEN** its API and SignalR requests are accepted by the production CORS
  policy

#### Scenario: Legacy origin is removed after retirement
- **WHEN** the approved migration period has ended
- **THEN** `https://poqr.snay.me` is absent from the production CORS policy

#### Scenario: Telemetry is configured
- **WHEN** the Debian service has an Application Insights connection string
- **THEN** its application telemetry is sent using that connection string
