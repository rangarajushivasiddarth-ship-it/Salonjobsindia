import { NextRequest, NextResponse } from 'next/server';
import { testConnection, executeQuery } from '@/lib/hostinger-mysql';
import { getSchemaQueries } from '@/lib/database-schema';

/**
 * POST /api/init-db
 * Initialize the database with all required tables
 * This should only be called once when setting up the database
 */
export async function POST(request: NextRequest) {
  try {
    // Test connection first
    console.log('[v0] Testing database connection...');
    const connectionOk = await testConnection();
    
    if (!connectionOk) {
      return NextResponse.json({
        success: false,
        message: 'Database connection failed'
      }, { status: 500 });
    }

    const schemaQueries = getSchemaQueries();
    const results: any[] = [];
    const errors: string[] = [];

    console.log('[v0] Starting database initialization...');
    console.log(`[v0] Creating ${schemaQueries.length} tables...`);

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
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorEntry = `✗ Error: ${errorMsg}`;
        errors.push(errorEntry);
        console.error('[v0]', errorEntry);
      }
    }

    // Summary
    const summary = {
      totalTables: schemaQueries.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    };

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Database initialization completed with errors',
        ...summary
      }, { status: 207 }); // 207 Multi-Status
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      timestamp: new Date().toISOString(),
      ...summary
    });

  } catch (error) {
    console.error('[v0] Database initialization error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database initialization failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * GET /api/init-db
 * Get database initialization status
 */
export async function GET(request: NextRequest) {
  try {
    // Test connection
    const connectionOk = await testConnection();
    
    if (!connectionOk) {
      return NextResponse.json({
        success: false,
        message: 'Database connection failed'
      }, { status: 500 });
    }

    // Check if tables exist
    const result = await executeQuery(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       ORDER BY TABLE_NAME`
    ) as any[];

    const tables = result.map((row: any) => row.TABLE_NAME);
    const requiredTables = [
      'users', 'jobs', 'subscriptions', 'messages', 
      'applications', 'notifications', 'salon_profiles', 
      'payments', 'job_alerts', 'audit_logs'
    ];
    
    const allTablesCreated = requiredTables.every(table => 
      tables.includes(table)
    );

    return NextResponse.json({
      success: true,
      message: 'Database status retrieved',
      data: {
        connected: true,
        database: process.env.DATABASE_NAME || 'unknown',
        tablesCreated: tables.length,
        requiredTables: requiredTables.length,
        allTablesCreated,
        tables: tables,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[v0] Error checking database status:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to check database status',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
