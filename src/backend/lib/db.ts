import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { createClient } from '@supabase/supabase-js';

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Supabase client for authentication and storage
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Query wrapper with error handling
export async function query<T extends QueryResultRow>(text: string, params: any[]): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
}

// Transaction helper
export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction failed', error);
    throw error;
  } finally {
    client.release();
  }
}

// Utility to generate UUIDs in the database
export function uuidGenerateV4(): string {
  return 'uuid_generate_v4()';
}

// Health check function for the database
export async function healthCheck(): Promise<boolean> {
  try {
    const { rows } = await query<{now: Date}>('SELECT NOW()', []);
    return rows.length > 0;
  } catch (error) {
    console.error('Database health check failed', error);
    return false;
  }
} 