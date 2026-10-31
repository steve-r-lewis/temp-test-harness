import pg from 'pg'

const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  connectionTimeoutMillis: 5000,
})
try {
  const { rows } = await pool.query('SELECT current_database() AS database, current_user AS username')
  if (rows[0]?.database !== 'authorisation_contract_test' || rows[0]?.username !== 'authorisation_contract') {
    throw new Error('Unexpected database or user')
  }
  console.log('Verified isolated PostgreSQL connection.')
} catch (error) {
  console.error('PostgreSQL connection check failed:', error instanceof Error ? error.message : String(error))
  process.exitCode = 1
} finally {
  await pool.end()
}
