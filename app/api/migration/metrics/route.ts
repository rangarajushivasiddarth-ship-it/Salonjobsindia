import { NextRequest, NextResponse } from 'next/server'
import { getMetrics, clearMetrics } from '@/lib/adapters/dual-read-adapter'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'get'
  const hours = parseInt(searchParams.get('hours') || '1')

  if (action === 'clear') {
    clearMetrics()
    return NextResponse.json({
      success: true,
      message: 'Metrics cleared'
    })
  }

  const metrics = getMetrics(hours)

  return NextResponse.json({
    success: true,
    metrics,
    period: hours + ' hour(s)',
    timestamp: new Date().toISOString()
  })
}
