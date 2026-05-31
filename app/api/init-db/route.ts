import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/hostinger-mysql';
import { getSchemaQueries } from '@/lib/database-schema';

/**
 * POST /api/init-db
 * Initialize the database with all required tables
 * This should only be called once when setting up the database
 */
export async function POST(request: NextRequest) {
  try {
    // Security check - verify admin token if available
    const authHeader = request.headers.get('authorization');
    const adminToken = process.env.DB_INIT_TOKEN;

    if (adminToken && authHeader !== `Bearer ${adminToken}`) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Invalid token'
      }, { status: 401 });
    }

    const schemaQueries = getSchemaQueries();
    const results: any[] = [];
    const errors: string[] = [];

    console.log('[v0] Starting database initialization...');

    // Execute each schema query
    for (const query of schemaQueries) {
      try {
        // Extract table name from query
        const tableMatch = query.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
        const tableName = tableMatch ? tableMatch[1] : 'unknown';

        // Execute the query
        await executeQuery(query);
        results.push(`✓ Table '${tableName}' created/verified`);
        console.log(`[v0] Created table: ${tableName}`);
      } catch (error) {
        const errorMsg = `✗ Error creating table: ${String(error)}`;
        errors.push(errorMsg);
        console.error('[v0]', errorMsg);
      }
    }

    // Summary
    const summary = {
      totalTables: results.length,
      successful: results.length - errors.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    };

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        ...summary
      }, { status: 207 }); // 207 Multi-Status
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialization completed successfully',
      ...summary
    });

  } catch (error) {
    console.error('[v0] Database initialization error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database initialization failed',
      error: String(error)
    }, { status: 500 });
  }
}

/**
 * GET /api/init-db
 * Get database initialization status
 */
export async function GET(request: NextRequest) {
  try {
    // Check if tables exist
    const result = await executeQuery(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       ORDER BY TABLE_NAME`
    ) as any[];

    const tables = result.map((row: any) => row.TABLE_NAME);

    return NextResponse.json({
      success: true,
      message: 'Database status retrieved',
      data: {
        tablesCreated: tables.length,
        tables: tables,
        database: process.env.HOSTINGER_DB_NAME,
        initialized: tables.length > 0
      }
    });
  } catch (error) {
    console.error('[v0] Error checking database status:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to check database status',
      error: String(error)
    }, { status: 500 });
  }
}
