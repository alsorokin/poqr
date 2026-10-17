# ✋️🗿🤚 Poqr

Anonymous planning poker app. Free and simple. Because all others suck.

Card deck: `1, 2, 3, 5, 8, 13, 21` and the Joker (`✋🗿🤚`).

## Run locally

Start the backend:

```bash
cd src/Poqr.Api && dotnet run
```

It listens on `http://localhost:5057`. In another terminal, start the frontend:

```bash
cd src/Poqr.Web && npm install && npm start
```

Open `http://localhost:4200`; use multiple tabs to simulate participants.

## Build and test

```bash
dotnet build Poqr.sln
(cd src/Poqr.Api.Tests && dotnet test)
(cd src/Poqr.Web && npm run build && npm test)
```

Run browser scenarios locally with:

```bash
cd src/Poqr.Web && npm run test:e2e
```

This starts local API and frontend servers and requires ports 5057 and 4200 to
be available. To smoke-test a deployed origin instead, set
`POQR_E2E_ORIGIN=https://poqr.snay.am`; this creates anonymous test sessions
and is not a CI check.

## Deployment

Debian is the production target; the manual Azure workflow is retained as a
recovery path. See [Deployment](docs/deployment.md) for release, rollback, and
infrastructure instructions.

## Constraints

- Server restarts clear active rooms; the app is currently single-instance.
- There is no authentication in v1.
