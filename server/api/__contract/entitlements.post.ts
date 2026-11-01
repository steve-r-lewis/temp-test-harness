/**
 * Explicit, repeatable development-only entitlement fixture setup.
 * The acceptance GET endpoint remains read-only.
 */
export default defineEventHandler(async (event) => {
  if (!import.meta.dev) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  if (process.env.PGDATABASE !== 'authorisation_contract_test' ||
      !['localhost', '127.0.0.1'].includes(getRequestURL(event).hostname)) {
    throw createError({ statusCode: 403, statusMessage: 'Local isolated test database required' })
  }

  const tenantId = '20000000-0000-4000-8000-000000000001'
  const groupId = '10000000-0000-4000-8000-000000000001'
  const activeId = '30000000-0000-4000-8000-000000000001'
  const suspendedId = '30000000-0000-4000-8000-000000000002'
  const roleId = 'contract-orders-view'

  // Public trusted-host functions; no manual writes to provider-owned tables.
  await defineAuthorisationRole({
    tenantId,
    role: {
      id: roleId,
      name: 'Contract fixture: view orders',
      permissions: [{ pattern: 'orders:view' }],
    },
    actorPrincipalId: activeId,
  })
  await assignAuthorisationRole({
    principalId: activeId, groupId, roleId, actorPrincipalId: activeId,
  })
  await assignAuthorisationRole({
    principalId: suspendedId, groupId, roleId, actorPrincipalId: activeId,
  })

  return { ready: true, roleId, principals: 2 }
})
