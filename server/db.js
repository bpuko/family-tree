import pg from 'pg';

const { Pool } = pg;
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: false
});

export async function ensureSchema() {
  const fs = await import('node:fs/promises');
  const sql = await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(sql);
}
