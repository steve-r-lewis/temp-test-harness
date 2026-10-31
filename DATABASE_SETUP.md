# Repeatable local PostgreSQL setup

On Windows PowerShell 7, create a local `.env` using `.env.example` and replace the password placeholder with a private, strong password. The file is Git-ignored.

`pnpm dev` now **runs database setup before Nuxt**, with `pnpm db:setup` available for standalone checks.

The setup script:
1. Checks Docker CLI/engine. If the engine is down, starts Docker Desktop and waits for it.
2. Creates `authorisation-test-db` using `postgres:18-alpine` and a named volume **only if the container does not exist**; otherwise starts the existing stopped container without replacing it.
3. Requires `127.0.0.1:5432`, checks PostgreSQL readiness, creates the dedicated `authorisation_contract` role and `authorisation_contract_test` database **only when missing**.
4. Refuses to take ownership of an existing test database owned by someone else. Does not reset an existing role password or alter `authorisation_e2e`.
5. Confirms the configured credentials against the intended database using the host `pg` package. A failure stops `pnpm dev`.

If the container was previously provisioned, use its existing dedicated role password in `.env`. New-container superuser credentials are generated ephemerally and never written to the repository.

**Scope:** This prepares the container, login and empty database; it does *not* run Authorisation migrations. After Nuxt starts, use the existing dev-only `POST /api/__contract/migrate` endpoint to apply the public provider migration. Never expose test endpoints in production.

Files are intended only for this Windows-based, disposable acceptance harness; no changes to the Authorisation provider.
