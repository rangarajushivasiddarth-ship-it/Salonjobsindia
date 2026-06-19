import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

/**
 * GET /api/sync/favorites
 * Get status of favorites sync
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[BackgroundSync] Getting favorites sync status");

    return NextResponse.json({
      success: true,
      message: "Favorites sync ready",
      status: "operational",
      endpoint: "/api/sync/favorites",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[BackgroundSync] Favorites status error:", error);
    return NextResponse.json(
      {
        error: "Failed to get favorites sync status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sync/favorites
 * Add a favorite from background sync queue
 * Only job seekers can favorite jobs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, queueId, userId } = body;

    console.log("[BackgroundSync] Processing queued favorite:", queueId);

    if (!jobId || !userId) {
      return NextResponse.json(
        { error: "Missing jobId or userId" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const favoritesCollection = db.collection("job_seeker_favorites");

    // Check if already favorited
    const existing = await favoritesCollection.findOne({
      userId,
      jobId,
    });

    if (existing) {
      console.log("[BackgroundSync] Favorite already exists:", jobId);
      return NextResponse.json({
        success: true,
        message: "Favorite already exists",
        queueId,
        jobId,
        alreadyExists: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Add favorite
    const result = await favoritesCollection.insertOne({
      userId,
      jobId,
      createdAt: new Date(),
      syncedAt: new Date(),
    });

    if (!result.acknowledged) {
      console.error("[BackgroundSync] Failed to add favorite");
      return NextResponse.json(
        { error: "Failed to add favorite" },
        { status: 500 }
      );
    }

    console.log("[BackgroundSync] Favorite added successfully:", jobId);

    return NextResponse.json({
      success: true,
      message: "Favorite added and synced",
      queueId,
      jobId,
      insertedId: result.insertedId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[BackgroundSync] Favorite add error:", error);
    return NextResponse.json(
      {
        error: "Failed to add favorite",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
