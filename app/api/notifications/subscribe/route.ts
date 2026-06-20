import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/notifications/subscribe
 * Subscribe a user to push notifications (stored in Supabase)
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
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { endpoint, auth, p256dh } = body;

    if (!endpoint || !auth || !p256dh) {
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
      return NextResponse.json(
        { error: "Invalid endpoint URL" },
        { status: 400 }
      );
    }

    // Store subscription in Supabase
    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: user.id,
        endpoint,
        auth,
        p256dh,
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error("[Notifications] Database error:", error);
      return NextResponse.json(
        { error: "Failed to save subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Successfully subscribed to notifications",
        subscriptionId: data?.[0]?.id,
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
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Missing subscriptionId" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('id', subscriptionId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to unsubscribe" },
        { status: 500 }
      );
    }

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
    message: vapidPublicKey 
      ? "Push notifications are configured and ready"
      : "VAPID_PUBLIC_KEY is not configured. Push notifications will not work.",
  });
}
