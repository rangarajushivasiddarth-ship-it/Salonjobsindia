import { NextRequest, NextResponse } from "next/server";
import { createJob, logSync } from "@/lib/db/jobs";

/**
 * GET /api/sync/job-submissions
 * Retrieve pending job submissions from background sync queue
 * Queue is stored in client localStorage, this endpoint gets status
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[BackgroundSync] Getting job submission sync status");

    // Return status message - actual queue data is stored on client
    // Client polls this to verify server is ready
    return NextResponse.json({
      success: true,
      message: "Job submission sync ready",
      status: "operational",
      endpoint: "/api/sync/job-submissions",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[BackgroundSync] Job submissions status error:", error);
    return NextResponse.json(
      {
        error: "Failed to get job submission status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sync/job-submissions
 * Submit a queued job from background sync
 * Called when user reconnects online or clicks manual sync
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobData, queueId } = body;

    console.log("[BackgroundSync] Processing queued job submission:", queueId);

    // Validate required fields
    if (!jobData || !queueId) {
      return NextResponse.json(
        { error: "Missing jobData or queueId" },
        { status: 400 }
      );
    }

    if (!jobData.salonName || !jobData.jobTitle) {
      return NextResponse.json(
        { error: "Missing required job fields (salonName, jobTitle)" },
        { status: 400 }
      );
    }

    // Validate owner_id is provided
    if (!jobData.owner_id) {
      return NextResponse.json(
        { error: "Missing owner_id" },
        { status: 400 }
      );
    }

    console.log("[BackgroundSync] Creating job from queue:", jobData.jobTitle);

    // Create job in database
    const jobResult = await createJob({
      owner_id: jobData.owner_id,
      title: jobData.jobTitle,
      description: jobData.description || "Job posting",
      salon_name: jobData.salonName,
      job_type: jobData.jobType || "full-time",
      skills: jobData.skills || [],
      experience_required: jobData.experience || 0,
      salary_min: jobData.salary?.min || 0,
      salary_max: jobData.salary?.max || 0,
      salary_currency: "INR",
      salary_period: "monthly",
      location_address: jobData.location?.address || "",
      location_city: jobData.location?.city || "",
      location_state: jobData.location?.state || "",
      location_lat: jobData.location?.lat || 0,
      location_lng: jobData.location?.lng || 0,
      payment_screenshot_url: jobData.screenshotUrl || "",
      payment_amount: jobData.planPrice || 0,
      payment_plan: jobData.planName || "Standard",
      status: "PAYMENT_PENDING",
      payment_status: "pending",
      is_visible: false,
      visibility: "private",
    });

    if (!jobResult.success) {
      console.error("[BackgroundSync] Failed to create job:", jobResult.error);
      await logSync(
        "job",
        "unknown",
        "create",
        "background-sync",
        "failed",
        null,
        null,
        JSON.stringify(jobResult.error)
      );

      return NextResponse.json(
        {
          error: "Failed to create job",
          details:
            jobResult.error instanceof Error
              ? jobResult.error.message
              : "Unknown error",
        },
        { status: 500 }
      );
    }

    const jobId = jobResult.data.id;
    console.log("[BackgroundSync] Job created successfully from queue:", jobId);

    // Log successful sync
    await logSync(
      "job",
      jobId,
      "create",
      "background-sync",
      "success",
      null,
      jobResult.data
    );

    return NextResponse.json({
      success: true,
      message: "Job submission synced successfully",
      queueId,
      jobId,
      status: "PAYMENT_PENDING",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[BackgroundSync] Job submission error:", error);
    return NextResponse.json(
      {
        error: "Failed to submit job",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
