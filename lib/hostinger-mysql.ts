import mysql from 'mysql2/promise';

// Create a pool of connections using Hostinger database credentials
// Phase 2 Optimization: Increased from 10 to 30 connections for 500-5,000 users
const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || process.env.HOSTINGER_DB_HOST || process.env.DB_HOST,
  port: parseInt(process.env.DATABASE_PORT || process.env.HOSTINGER_DB_PORT || process.env.DB_PORT || '3306'),
  user: process.env.DATABASE_USER || process.env.HOSTINGER_DB_USER || process.env.DB_USER,
  password: process.env.DATABASE_PASSWORD || process.env.HOSTINGER_DB_PASSWORD || process.env.DB_PASSWORD,
  database: process.env.DATABASE_NAME || process.env.HOSTINGER_DB_NAME || process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 30, // Phase 2: Increased from 10 to 30
  queueLimit: 0,
  enableKeepAlive: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
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
  try {
    const connection = await getConnection();
    try {
      const [results] = await connection.execute(sql, values || []);
      return results as T[];
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[v0] Query execution failed:', error);
    throw error;
  }
}

/**
 * Execute an insert query and return inserted ID
 */
export async function executeInsert(sql: string, values?: any[]) {
  try {
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(sql, values || []);
      return result;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[v0] Insert execution failed:', error);
    throw error;
  }
}

/**
 * Execute update or delete query
 */
export async function executeUpdate(sql: string, values?: any[]) {
  try {
    const connection = await getConnection();
    try {
      const [result] = await connection.execute(sql, values || []);
      return result;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[v0] Update execution failed:', error);
    throw error;
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
