import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/notifications/test
 * Send a test notification to all subscribed users
 * For development/testing purposes only
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is from localhost or has proper auth
    const origin = request.headers.get("origin");
    const isLocalhost = origin?.includes("localhost") || origin?.includes("127.0.0.1");

    if (!isLocalhost && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Test endpoint not available in production" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title = "Salon Jobs India",
      body: notificationBody = "You have a new job opportunity!",
      icon = "/icon-192.png",
      badge = "/icon-96.png",
      tag = "test-notification",
    } = body;

    console.log("[Notifications] Test notification request:", {
      title,
      body: notificationBody,
      tag,
    });

    // In production, this would query subscriptions from database and send to each
    // For now, just return success to verify the endpoint works
    return NextResponse.json({
      success: true,
      message: "Test notification endpoint working",
      notification: {
        title,
        body: notificationBody,
        icon,
        badge,
        tag,
      },
    });
  } catch (error) {
    console.error("[Notifications] Test notification error:", error);
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 }
    );
  }
}
