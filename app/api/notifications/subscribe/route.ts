import { NextRequest, NextResponse } from "next/server";

interface PushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// In-memory store for subscriptions (in production, use a database)
const subscriptions = new Map<string, PushSubscription>();

/**
 * POST /api/notifications/subscribe
 * Subscribe a user to push notifications
 * 
 * Body: PushSubscription object from pushManager.subscribe()
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as PushSubscription;
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      console.error("[Notifications] Invalid subscription payload:", {
        hasEndpoint: !!endpoint,
        hasKeys: !!keys,
        hasP256dh: !!keys?.p256dh,
        hasAuth: !!keys?.auth,
      });
      return NextResponse.json(
        { 
          error: "Missing required subscription fields",
          received: { endpoint: !!endpoint, keys: !!keys }
        },
        { status: 400 }
      );
    }

    // Store the subscription (keyed by endpoint)
    const subscriptionId = endpoint.substring(0, 50);
    subscriptions.set(subscriptionId, body);

    console.log("[Notifications] Subscription received and stored:", {
      endpoint: subscriptionId + "...",
      totalSubscriptions: subscriptions.size,
    });

    return NextResponse.json(
      { 
        success: true,
        message: "Successfully subscribed to notifications",
        subscriptionId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Notifications] Subscription error:", error);
    return NextResponse.json(
      { 
        error: "Failed to subscribe to notifications",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/subscribe
 * Get push notification subscription status and VAPID public key
 */
export async function GET() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    console.warn("[Notifications] VAPID public key not configured");
    return NextResponse.json(
      { error: "VAPID key not configured" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    supported: true,
    vapidPublicKey,
    subscriptionCount: subscriptions.size,
  });
}

/**
 * DELETE /api/notifications/subscribe
 * Unsubscribe from push notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing endpoint" },
        { status: 400 }
      );
    }

    const subscriptionId = endpoint.substring(0, 50);
    const deleted = subscriptions.delete(subscriptionId);

    console.log("[Notifications] Unsubscription:", {
      subscriptionId: subscriptionId + "...",
      wasSubscribed: deleted,
      remainingSubscriptions: subscriptions.size,
    });

    return NextResponse.json({
      success: true,
      message: deleted ? "Successfully unsubscribed" : "Subscription not found",
    });
  } catch (error) {
    console.error("[Notifications] Unsubscription error:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
