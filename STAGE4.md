# Stage 4 — Required host adapters

This stage uses only the provider's root `CONTRACT.md` and its declared `@nuxt4-layers/authorisation/contracts` exports.

`server/plugins/authorisation-host-adapters.ts` registers Directory, Governance, Subject Resolver and two sample domain permissions via public Nuxt server functions. The existing PostgreSQL plugin remains responsible for the database port.

**Fixtures deliberately deny all access:**
- Unknown principals and groups resolve to `null`.
- Ownership returns `false`, owner counts return zero.
- HTTP subject resolution returns `null` (no authentication has been integrated).
- `orders:view` and `orders:process_refund` are declared; declaration alone does not grant access.

The fixtures are suitable only for this isolated development harness and are not Identity or Authentication replacements.

## CI/local acceptance

Use the existing `pnpm dev` setup. CI or the operator should confirm that the public type imports and provider registrations compile, that the app starts, and that unknown principals/permissions remain denied. Do not inspect the provider's private implementation to resolve any type mismatch; record a contract defect instead.

No access-granting fixtures, persistent IAM records, approval workflow or positive decision assertions are included in Stage 4. Stage 5 will require explicit, isolated actor/group fixtures and authorised role assignments, with strict tenant and assurance checks.
