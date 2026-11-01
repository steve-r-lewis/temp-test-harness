/**
 * Stage 5 negative decision matrix. The subjects are constructed on the server;
 * the endpoint accepts no principal, assurance or tenant input from callers.
 */
export default defineEventHandler(async () => {
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
      subject: subject('30000000-0000-4000-8000-000000000099'),
      permission: 'orders:view',
      resource,
    },
    {
      name: 'unknown permission',
      subject: subject('30000000-0000-4000-8000-000000000001'),
      permission: 'orders:nonexistent',
      resource,
    },
    {
      name: 'suspended principal',
      subject: subject('30000000-0000-4000-8000-000000000002'),
      permission: 'orders:view',
      resource,
    },
    {
      name: 'tenant mismatch',
      subject: subject('30000000-0000-4000-8000-000000000001'),
      permission: 'orders:view',
      resource,
      requestTenantId: '20000000-0000-4000-8000-000000000099',
    },
  ]

  const results = []
  for (const testCase of cases) {
    const decision = await authorise(testCase)
    results.push({ case: testCase.name, denied: !decision.allowed, reason: decision.allowed ? null : decision.reason })
    if (decision.allowed) {
      throw createError({
        statusCode: 500,
        statusMessage: `Contract acceptance failed: unexpected allow for ${testCase.name}`,
      })
    }
  }
  return { passed: true, results }
})
