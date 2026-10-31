/** Development-only Authorisation migration acceptance endpoint. */
export default defineEventHandler(async () => {
  if (!import.meta.dev) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  if (process.env.PGDATABASE !== 'authorisation_contract_test') {
    throw createError({ statusCode: 403, statusMessage: 'Test database only' })
  }

  // Public server auto-import documented in CONTRACT.md.
  await migrateAuthorisationDatabase()
  return { migrated: true, database: 'authorisation_contract_test' }
})
