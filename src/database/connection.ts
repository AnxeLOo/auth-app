import { Pool, PoolConfig } from 'pg';
import { env } from '../config/env';

const poolConfig: PoolConfig = {
  host: env.H2_HOST,
  port: env.H2_PORT,
  database: env.H2_DATABASE,
  user: env.H2_USER,
  password: env.H2_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('⚠️ Erro inesperado no pool de conexão H2:', err.message);
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG_SQL === 'true') {
    console.log('Executed query', { text, duration, rows: res.rowCount });
  }
  return res.rows;
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    return false;
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
