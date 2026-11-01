# Stage 5 — Targeted acceptance corrections

The original negative matrix accepted **any** denial, even when the test was not exercising the claimed safeguard. Local observations:

| Scenario | Observed reason | Interpretation |
| --- | --- | --- |
| Unknown principal | `unknown-subject` | Correctly denied |
| Unknown permission | `unknown-permission` | Correctly denied |
| Suspended principal | `unknown-group` | Inconclusive |
| Tenant mismatch | `unknown-group` | Inconclusive |

The revised endpoint now **fails** when `unknown-group` masks any case, asserts `unknown-subject` and `unknown-permission` for the first two cases, and requires `tenant-mismatch` for the tenant case. Suspension must produce a non-group, non-allow decision; the contract does not specify a distinct suspension reason for a suspended actor (it lists `paused` but not `suspended`).

## Fixture blocker (not worked around)

The Stage 4 Governance fixture intentionally returns `null`. To make a valid governed group, a consumer needs an `AuthorisationGovernedGroup` whose `approvals.required` member is `AuthorisationRequiredApprovers`. The root contract points to the supported public `@nuxt4-layers/authorisation/contracts` TypeScript export, but does not reproduce the shape. **Use that installed public type** when authoring the real fixture. Do not cast guessed objects to it, read implementation internals, or fabricate policy values.

A positive allow test additionally requires a public, fully specified trusted role-assignment or grant provisioning call. The root contract names `assignAuthorisationRole` and `createAuthorisationGrant` without specifying their required inputs; use public export signatures if available, otherwise raise a contract-completeness defect before implementation. Do not write directly to provider-owned SQL tables.

## Acceptance criteria for the next increment

1. Provide one legitimate synthetic governed group with a valid public approval policy.
2. Confirm an active but unassigned subject has no entitlement (`not-permitted`).
3. Assert a suspended subject is refused for the intended security reason, not because the group is missing.
4. Assert an otherwise valid active subject crossing a tenant boundary returns `tenant-mismatch`.
5. Provision a role/grant via documented public server API and demonstrate an authorised `allowed: true` decision.
6. Verify development-only routes and error redaction in production separately through CI/local configuration.

The stricter endpoint intentionally remains **red** for cases 3–4 until the governance fixture is completed. This PR is a test correctness improvement, not a claim that those scenarios now pass. CI and local validation own execution.
