import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/server/src/config/database'
import Job from '@/server/src/models/Job'
import mongoose from 'mongoose'

// GET - Server-sent events for real-time job updates via MongoDB Change Streams
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') || 'pending' // 'pending', 'live', or 'all'
  const ownerId = searchParams.get('ownerId') || ''

  try {
    await connectDB()

    // Create a readable stream for SSE
    const encoder = new TextEncoder()
    let isConnected = true

    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          // Build pipeline for change stream
          const pipeline: any[] = []

          // Filter for specific update types
          if (filter === 'pending') {
            pipeline.push({
              $match: {
                $or: [
                  { 'operationType': 'insert', 'fullDocument.status': 'PAYMENT_PENDING' },
                  { 'operationType': 'update', 'updateDescription.updatedFields.status': 'PAYMENT_PENDING' },
                  { 'operationType': 'update', 'updateDescription.updatedFields.paymentStatus': 'pending' }
                ]
              }
            })
          } else if (filter === 'live') {
            pipeline.push({
              $match: {
                $or: [
                  { 'operationType': 'update', 'updateDescription.updatedFields.status': 'LIVE' },
                  { 'operationType': 'update', 'updateDescription.updatedFields.isVisible': true }
                ]
              }
            })
          }

          if (ownerId) {
            pipeline.push({
              $match: {
                'fullDocument.ownerId': new mongoose.Types.ObjectId(ownerId)
              }
            })
          }

          // Open change stream
          const changeStream = Job.collection.watch(pipeline, {
            fullDocument: 'updateLookup',
            resumeAfter: undefined
          })

          // Send initial connected message
          controller.enqueue(
            encoder.encode('data: {"type":"connected","message":"Real-time updates connected"}\n\n')
          )

          // Listen for changes
          changeStream.on('change', (change: any) => {
            if (!isConnected) {
              changeStream.close()
              return
            }

            const event = {
              type: 'job_update',
              operationType: change.operationType,
              documentId: change.documentKey._id.toString(),
              fullDocument: change.fullDocument || change.updateDescription,
              timestamp: new Date().toISOString()
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            )
          })

          // Handle errors
          changeStream.on('error', (error: any) => {
            console.error('[v0] Change stream error:', error)
            controller.enqueue(
              encoder.encode(`data: {"type":"error","message":"Stream error"}\n\n`)
            )
            changeStream.close()
          })

          // Handle close
          changeStream.on('close', () => {
            isConnected = false
            controller.close()
          })

          // Cleanup on client disconnect
          request.signal?.addEventListener('abort', () => {
            isConnected = false
            changeStream.close()
            controller.close()
          })
        } catch (error) {
          console.error('[v0] Stream setup error:', error)
          controller.enqueue(
            encoder.encode(`data: {"type":"error","message":"Setup failed"}\n\n`)
          )
          controller.close()
        }
      }
    })

    return new NextResponse(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('[v0] Real-time error:', error)
    return NextResponse.json(
      { error: 'Failed to establish real-time connection' },
      { status: 500 }
    )
  }
}
