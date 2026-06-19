import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, SalonOwnerDocument, JobSeekerDocument } from "@/lib/mongodb";

/**
 * GET /api/sync/profile-updates
 * Get status of profile update sync
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[BackgroundSync] Getting profile update sync status");

    return NextResponse.json({
      success: true,
      message: "Profile update sync ready",
      status: "operational",
      endpoint: "/api/sync/profile-updates",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[BackgroundSync] Profile status error:", error);
    return NextResponse.json(
      {
        error: "Failed to get profile update status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sync/profile-updates
 * Submit profile updates from background sync queue
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileData, queueId, userId, role } = body;

    console.log("[BackgroundSync] Processing queued profile update:", queueId);

    if (!profileData || !userId) {
      return NextResponse.json(
        { error: "Missing profileData or userId" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    // Update based on user role
    if (role === "salon_owner") {
      const collection = db.collection<SalonOwnerDocument>("salon_owners");
      const result = await collection.updateOne(
        { userId },
        {
          $set: {
            ...profileData,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      if (!result.acknowledged) {
        console.error("[BackgroundSync] Failed to update salon owner profile");
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 }
        );
      }

      console.log("[BackgroundSync] Salon owner profile updated:", userId);

      return NextResponse.json({
        success: true,
        message: "Profile update synced",
        queueId,
        userId,
        role: "salon_owner",
        modifiedCount: result.modifiedCount,
        timestamp: new Date().toISOString(),
      });
    } else if (role === "job_seeker") {
      const collection = db.collection<JobSeekerDocument>("job_seekers");
      const result = await collection.updateOne(
        { userId },
        {
          $set: {
            ...profileData,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      if (!result.acknowledged) {
        console.error("[BackgroundSync] Failed to update job seeker profile");
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 }
        );
      }

      console.log("[BackgroundSync] Job seeker profile updated:", userId);

      return NextResponse.json({
        success: true,
        message: "Profile update synced",
        queueId,
        userId,
        role: "job_seeker",
        modifiedCount: result.modifiedCount,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        { error: "Invalid user role" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[BackgroundSync] Profile update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
