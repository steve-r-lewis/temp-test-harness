# Stage 5 — Decision matrix (first increment)

Only the root Authorisation `CONTRACT.md` and declared public types are used. The harness keeps its PostgreSQL test database and adds two fixed, synthetic principals: one active, one suspended, with a single synthetic group and tenant. The HTTP subject resolver **always returns null**; callers cannot nominate a test identity.

Development-only `GET /api/__contract/decisions` invokes the documented server `authorise()` function with server-constructed inputs. The intended negative assertions are:

- Unknown principal denied.
- Unknown permission denied.
- Suspended principal denied.
- Mismatched requested tenant denied.

The endpoint returns the individual denial reasons and fails with HTTP 500 if any case is allowed. Unexpected composition, governance or database errors are **not** concealed as successful denials.

**Not yet a complete Stage 5 acceptance:** No positive authorisation grant is installed. Public `CONTRACT.md` identifies trusted role assignment functions but does not provide their concrete call signatures, mandatory inputs or a complete standalone example. The acceptance test therefore does not guess administrative API payloads or directly modify tables. Positive decision and explicit unassigned-role denial remain blocked on a documented public role provisioning recipe or exported public signatures verified by CI/local inspection of the installed `./contracts` export.

The deliberately null Governance description may also prevent decision evaluation before reaching the intended denial; if that happens, report it as an integration/API-contract finding rather than fabricating governance policy.

## Local/CI execution

With the branch checked out and test DB prepared through `pnpm dev`, request:

```powershell
Invoke-RestMethod http://localhost:3000/api/__contract/decisions
```

Do not merge on the strength of the PR alone. No tests, builds or type checks were run by the assistant. Legacy Stage 2 missing-port test remains historical and cannot pass with all required ports present.
