import mysql from 'mysql2/promise';

// Create a pool of connections
const pool = mysql.createPool({
  host: process.env.HOSTINGER_DB_HOST || process.env.DB_HOST,
  port: parseInt(process.env.HOSTINGER_DB_PORT || process.env.DB_PORT || '3306'),
  user: process.env.HOSTINGER_DB_USER || process.env.DB_USER,
  password: process.env.HOSTINGER_DB_PASSWORD || process.env.DB_PASSWORD,
  database: process.env.HOSTINGER_DB_NAME || process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
});

/**
 * Get a connection from the pool
 */
export async function getConnection() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('[v0] Failed to get database connection:', error);
    throw error;
  }
}

/**
 * Execute a query on the database
 */
export async function executeQuery<T = any>(sql: string, values?: any[]): Promise<T[]> {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(sql, values || []);
    return results as T[];
  } finally {
    connection.release();
  }
}

/**
 * Execute an insert query and return inserted ID
 */
export async function executeInsert(sql: string, values?: any[]) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(sql, values || []);
    return result;
  } finally {
    connection.release();
  }
}

/**
 * Execute update or delete query
 */
export async function executeUpdate(sql: string, values?: any[]) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(sql, values || []);
    return result;
  } finally {
    connection.release();
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await executeQuery('SELECT 1 as test');
    console.log('[v0] Database connection test successful');
    return true;
  } catch (error) {
    console.error('[v0] Database connection test failed:', error);
    return false;
  }
}

/**
 * Close all connections in the pool
 */
export async function closeConnections() {
  try {
    await pool.end();
    console.log('[v0] Database pool closed');
  } catch (error) {
    console.error('[v0] Error closing database pool:', error);
  }
}

export default pool;
