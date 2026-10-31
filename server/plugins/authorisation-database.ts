import pg from 'pg'

/** Host-owned PostgreSQL pool, supplied through the documented public port. */
export default defineNitroPlugin((nitroApp) => {
  const required = ['PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'] as const
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Authorisation acceptance database: missing ${missing.join(', ')}`)
  }
  if (process.env.PGDATABASE !== 'authorisation_contract_test') {
    throw new Error('Authorisation acceptance database: refusing a non-test database')
  }

  const pool = new pg.Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  })

  provideAuthorisationDatabase({ dialect: 'postgres', pool })

  nitroApp.hooks.hook('close', async () => {
    await pool.end()
  })
})
