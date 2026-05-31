import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, testConnection } from '@/lib/hostinger-mysql';

export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return NextResponse.json({ 
        success: false,
        message: 'Database connection failed',
        error: 'Unable to connect to Hostinger MySQL database'
      }, { status: 500 });
    }

    // Try a simple query
    const result = await executeQuery('SELECT 1 as test, NOW() as timestamp');

    return NextResponse.json({ 
      success: true,
      message: 'Database connection successful',
      data: {
        connected: true,
        database: process.env.HOSTINGER_DB_NAME,
        host: process.env.HOSTINGER_DB_HOST,
        port: process.env.HOSTINGER_DB_PORT,
        result: result
      }
    });
  } catch (error) {
    console.error('[v0] Database test error:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Database test failed',
      error: String(error),
      hint: 'Check your Hostinger database credentials in environment variables'
    }, { status: 500 });
  }
}
