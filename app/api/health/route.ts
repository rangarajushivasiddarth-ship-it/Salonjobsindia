import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/server/src/config/database'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {}
  }

  // Check MongoDB
  try {
    await connectDB()
    health.checks.mongodb = { status: 'healthy', latency: 'connected' }
  } catch (error) {
    health.checks.mongodb = { status: 'unhealthy', error: (error as any).message }
    health.status = 'degraded'
  }

  // Check Supabase
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('jobs')
      .select('id')
      .limit(1)

    if (error) {
      health.checks.supabase = { status: 'unhealthy', error: error.message }
      health.status = 'degraded'
    } else {
      health.checks.supabase = { status: 'healthy', latency: 'connected' }
    }
  } catch (error) {
    health.checks.supabase = { status: 'unhealthy', error: (error as any).message }
    health.status = 'degraded'
  }

  const duration = Date.now() - startTime
  health.duration = duration + 'ms'

  const statusCode = health.status === 'healthy' ? 200 : 503

  return NextResponse.json(health, { status: statusCode })
}
