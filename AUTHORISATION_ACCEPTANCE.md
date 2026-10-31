# Authorisation clean-room acceptance — Stage 2

Provider documentation used: the supplied root `nuxt-layers/authorisation/CONTRACT.md` only. No provider implementation or private documentation is needed.

## Scenario

The Nuxt host includes `@nuxt4-layers/authorisation` with presentation disabled and deliberately supplies **none** of Authorisation's required ports.

In development only, request `GET /api/__contract/authorisation`. Its handler invokes the public server auto-import `authorise({...})` with an authenticated-looking subject, declared permission and group-owned resource.

Expected response: HTTP 200, `{ "passed": true, "behaviour": "missing-required-port", "port": "..." }`, with the port provided by the public `AuthorisationCompositionError` class. Unexpected authorisation, a missing auto-import or any other error causes HTTP 500.

The route is disabled outside development (HTTP 404). This tests controlled failure with absent ports; it **does not** prove legitimate access, tenant isolation, database migrations or role/approval correctness.

## How to validate locally

After checking out this PR branch, while using the existing installed dependency:

```powershell
pnpm install --frozen-lockfile
pnpm exec nuxt prepare
pnpm dev
```

In a second PowerShell terminal:

```powershell
Invoke-RestMethod http://localhost:3000/api/__contract/authorisation
```

Report the JSON result and any compile/runtime errors as provider contract defects where the published public API differs from the contract. Do not inspect provider private source to repair the consumer.
