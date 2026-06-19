import { NextRequest, NextResponse } from "next/server";

// In-memory store for demonstration
// In production, use a database like Supabase or Neon
const subscriptionStore = new Set<string>();

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
      console.error("[Notifications] Missing required fields");
      return NextResponse.json(
        { 
          error: "Missing required subscription fields",
          required: ["endpoint", "auth", "p256dh"]
        },
        { status: 400 }
      );
    }

    // Validate endpoint URL
    try {
      new URL(endpoint);
    } catch (err) {
      console.error("[Notifications] Invalid endpoint URL:", endpoint);
      return NextResponse.json(
        { error: "Invalid endpoint URL" },
        { status: 400 }
      );
    }

    // Store the subscription
    const subscriptionKey = `${endpoint}:${auth}`;
    subscriptionStore.add(subscriptionKey);

    console.log("[Notifications] New subscription received:", {
      endpoint: endpoint.substring(0, 50) + "...",
      auth: auth.substring(0, 20) + "...",
      totalSubscriptions: subscriptionStore.size,
    });

    // TODO: In production, store in Supabase/Neon
    // const { data, error } = await supabase.from('push_subscriptions').insert({
    //   user_id: userId,
    //   endpoint,
    //   auth,
    //   p256dh,
    //   created_at: new Date().toISOString(),
    // });
    //
    // if (error) {
    //   console.error("[Notifications] Database error:", error);
    //   return NextResponse.json(
    //     { error: "Failed to save subscription" },
    //     { status: 500 }
    //   );
    // }

    return NextResponse.json(
      { 
        success: true,
        message: "Successfully subscribed to notifications",
        subscriptionId: Buffer.from(subscriptionKey).toString("base64"),
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
 * DELETE /api/notifications/subscribe
 * Unsubscribe from push notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, auth } = body;

    if (!endpoint || !auth) {
      return NextResponse.json(
        { error: "Missing endpoint or auth" },
        { status: 400 }
      );
    }

    const subscriptionKey = `${endpoint}:${auth}`;
    subscriptionStore.delete(subscriptionKey);

    console.log("[Notifications] Subscription removed:", {
      endpoint: endpoint.substring(0, 50) + "...",
      remainingSubscriptions: subscriptionStore.size,
    });

    return NextResponse.json(
      { 
        success: true,
        message: "Successfully unsubscribed from notifications"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Notifications] Unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/subscribe
 * Get push notification configuration and support status
 */
export async function GET() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  return NextResponse.json({
    supported: true,
    vapidPublicKey: vapidPublicKey || "",
    isConfigured: !!vapidPublicKey,
    totalActiveSubscriptions: subscriptionStore.size,
    message: vapidPublicKey 
      ? "Push notifications are configured and ready"
      : "VAPID_PUBLIC_KEY is not configured. Push notifications will not work.",
  });
}
