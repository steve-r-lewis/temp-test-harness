import { AuthorisationCompositionError } from '@nuxt4-layers/authorisation/contracts'

/**
 * Stage 2: consumer-only acceptance of fail-closed behaviour.
 * No database, directory, governance, principal resolver or permissions
 * are registered. The server operation must fail as documented.
 *
 * Do not ship this route: it is unavailable outside development.
 */
export default defineEventHandler(async () => {
  if (!import.meta.dev) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  let caught: unknown

  try {
    const decision = await authorise({
      subject: {
        principalId: '00000000-0000-4000-8000-000000000001',
        authenticatedAt: new Date().toISOString(),
        assurance: { level: 'aal2', phishingResistant: true },
      },
      permission: 'orders:view',
      resource: {
        type: 'orders',
        id: '00000000-0000-4000-8000-000000000002',
        owningGroupId: '00000000-0000-4000-8000-000000000003',
      },
    })

    throw createError({
      statusCode: 500,
      statusMessage: `Unexpected decision without required ports: ${decision.allowed}`,
    })
  } catch (error) {
    caught = error
  }

  if (caught instanceof AuthorisationCompositionError) {
    return { passed: true, behaviour: 'missing-required-port', port: caught.port }
  }

  throw createError({
    statusCode: 500,
    statusMessage: 'Contract acceptance failed: expected AuthorisationCompositionError',
  })
})
