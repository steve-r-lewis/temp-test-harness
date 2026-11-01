/**
 * Stage 5 decision matrix, including positive entitlement and suspension controls. The subjects are constructed on the server;
 * the endpoint accepts no principal, assurance or tenant input from callers.
 */
export default defineEventHandler(async (event) => {
  if (!import.meta.dev) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  if (process.env.PGDATABASE !== 'authorisation_contract_test') {
    throw createError({ statusCode: 403, statusMessage: 'Isolated test database required' })
  }

  const owningGroupId = '10000000-0000-4000-8000-000000000001'
  const resource = {
    type: 'orders',
    id: '40000000-0000-4000-8000-000000000001',
    owningGroupId,
  }

  const subject = (principalId: string) => ({
    principalId,
    authenticatedAt: new Date().toISOString(),
    assurance: { level: 'aal2' as const, phishingResistant: true },
  })

  const cases = [
    {
      name: 'unknown principal',
      expectedReason: 'unknown-subject',
      subject: subject('30000000-0000-4000-8000-000000000099'),
      permission: 'orders:view',
      resource,
    },
    {
      name: 'unknown permission',
      expectedReason: 'unknown-permission',
      subject: subject('30000000-0000-4000-8000-000000000001'),
      permission: 'orders:nonexistent',
      resource,
    },
    {
      name: 'suspended principal',
      expectedReason: 'not-permitted', // Entitled but suspended; no active access route.
      subject: subject('30000000-0000-4000-8000-000000000002'),
      permission: 'orders:view',
      resource,
    },
    {
      name: 'tenant mismatch',
      expectedReason: 'tenant-mismatch',
      subject: subject('30000000-0000-4000-8000-000000000001'),
      permission: 'orders:view',
      resource,
      requestTenantId: '20000000-0000-4000-8000-000000000099',
    },
  ]

  const results = []
  for (const testCase of cases) {
    const decision = await authorise(testCase)
    const reason = decision.allowed ? null : decision.reason
    const correctlyDenied = !decision.allowed && reason !== 'unknown-group' &&
      (testCase.expectedReason === null || reason === testCase.expectedReason)
    results.push({ case: testCase.name, passed: correctlyDenied, denied: !decision.allowed, reason })
  }
  // Both principals receive the same explicit orders:view role from the
  // development-only setup endpoint. Only their Directory standing differs.
  // A missing setup cannot produce a false pass: the active control must allow.
  const activeDecision = await authorise({
    subject: subject('30000000-0000-4000-8000-000000000001'),
    permission: 'orders:view',
    resource,
  })
  const suspendedDecision = await authorise({
    subject: subject('30000000-0000-4000-8000-000000000002'),
    permission: 'orders:view',
    resource,
  })
  const activeAllowed = activeDecision.allowed && activeDecision.via === 'role'
  const suspendedDenied = !suspendedDecision.allowed && suspendedDecision.reason === 'not-permitted'
  results.push({
    case: 'entitled active principal',
    passed: activeAllowed,
    denied: !activeDecision.allowed,
    reason: activeDecision.allowed ? null : activeDecision.reason,
  })
  results.push({
    case: 'equivalently entitled suspended principal',
    passed: suspendedDenied && activeAllowed,
    denied: !suspendedDecision.allowed,
    reason: suspendedDecision.allowed ? null : suspendedDecision.reason,
  })

  // Return every public decision, including failures, for one-request diagnostics.
  // HTTP 500 preserves the acceptance failure signal for CI.
  const passed = results.every(result => result.passed)
  if (!passed) {
    setResponseStatus(event, 500)
  }
  return { passed, results }
})
