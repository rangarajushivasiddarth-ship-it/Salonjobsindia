import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/notifications/subscribe
 * Subscribe a user to push notifications
 * 
 * Body:
 * {
 *   endpoint: string
 *   auth: string
 *   p256dh: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, auth, p256dh } = body;

    if (!endpoint || !auth || !p256dh) {
      return NextResponse.json(
        { error: "Missing required subscription fields" },
        { status: 400 }
      );
    }

    // In production, store the subscription in a database
    // For now, we'll just acknowledge receipt
    console.log("[Notifications] New subscription received:", {
      endpoint: endpoint.substring(0, 50) + "...",
    });

    return NextResponse.json(
      { 
        success: true,
        message: "Successfully subscribed to notifications"
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Notifications] Subscription error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe to notifications" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/subscribe
 * Get push notification subscription status
 */
export async function GET() {
  return NextResponse.json({
    supported: true,
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  });
}
