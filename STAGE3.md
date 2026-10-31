# Stage 3 — PostgreSQL migration acceptance

Based only on the provider's root `CONTRACT.md` and its declared public API.

Prerequisites: local `authorisation_contract_test` PostgreSQL database; a dedicated PostgreSQL role; `pg` and `@types/pg` installed in the host; `.env` (Git-ignored) with `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`.

1. Place the two `server/` files in the harness. Do **not** change the provider repository.
2. Start `pnpm dev` in the harness. Nuxt loads local `.env` on startup.
3. In another PowerShell terminal, execute twice:

   `Invoke-RestMethod -Method Post http://localhost:3000/api/__contract/migrate`

4. Verify schema in the isolated database:

   `docker exec authorisation-test-db psql -U postgres -d authorisation_contract_test -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'authorisation';"`

The endpoint is development-only and guarded against accidental use with other database names. No database schema is explicitly created by the harness; the provider migration API owns it. Unexpected errors or missing auto-imports are contract/implementation findings to record, not a reason to inspect private provider source.

**Important:** Starting this plugin changes Stage 2's missing-database-port scenario; run that regression in a separate branch or before installing Stage 3 files. Avoid committing `.env` or credentials.
