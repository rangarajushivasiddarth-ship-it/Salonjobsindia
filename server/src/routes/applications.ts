import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { authenticate, requireProfessional, requireOwner } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Helper to check validation results
const checkValidation = (req: Request): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg);
  }
};

// ============== PROFESSIONAL ENDPOINTS ==============

/**
 * POST /api/applications
 * Apply to a job
 */
router.post('/', authenticate, requireProfessional, [
  body('jobId').isMongoId().withMessage('Invalid job ID'),
  body('coverLetter').optional().isLength({ max: 2000 }),
  body('expectedSalary').optional().isInt({ min: 0 })
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const { jobId, coverLetter, resumeUrl, expectedSalary, availableFrom } = req.body;
  
  // Check if job exists and is active
  const job = await Job.findById(jobId);
  
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }
  
  if (job.status !== 'LIVE' || !job.isVisible) {
    throw new ApiError(400, 'This job is no longer accepting applications');
  }
  
  // Check for existing application
  const existingApplication = await Application.findOne({
    jobId,
    professionalId: req.user!.id
  });
  
  if (existingApplication) {
    throw new ApiError(400, 'You have already applied to this job');
  }
  
  // Create application
  const application = new Application({
    jobId,
    professionalId: req.user!.id,
    ownerId: job.ownerId,
    coverLetter,
    resumeUrl,
    expectedSalary,
    availableFrom: availableFrom ? new Date(availableFrom) : undefined,
    status: 'pending',
    appliedAt: new Date()
  });
  
  await application.save();
  
  // Increment job application count
  await Job.updateOne({ _id: jobId }, { $inc: { applicationCount: 1 } });
  
  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    application
  });
}));

/**
 * GET /api/applications/my-applications
 * Get professional's applications
 */
router.get('/my-applications', authenticate, requireProfessional, asyncHandler(async (req: Request, res: Response) => {
  const { status, page = 1, limit = 20 } = req.query;
  
  const query: Record<string, unknown> = { professionalId: req.user!.id };
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [applications, total] = await Promise.all([
    Application.find(query)
      .populate({
        path: 'jobId',
        select: 'title salonName location salary jobType status',
        populate: {
          path: 'ownerId',
          select: 'name avatar'
        }
      })
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Application.countDocuments(query)
  ]);
  
  res.json({
    success: true,
    applications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

/**
 * PUT /api/applications/:id/withdraw
 * Withdraw an application
 */
router.put('/:id/withdraw', authenticate, requireProfessional, [
  param('id').isMongoId().withMessage('Invalid application ID')
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const application = await Application.findOne({
    _id: req.params.id,
    professionalId: req.user!.id
  });
  
  if (!application) {
    throw new ApiError(404, 'Application not found');
  }
  
  if (['hired', 'rejected', 'withdrawn'].includes(application.status)) {
    throw new ApiError(400, 'Cannot withdraw this application');
  }
  
  application.status = 'withdrawn';
  await application.save();
  
  res.json({
    success: true,
    message: 'Application withdrawn',
    application
  });
}));

// ============== OWNER ENDPOINTS ==============

/**
 * GET /api/applications/job/:jobId
 * Get applications for a specific job
 */
router.get('/job/:jobId', authenticate, requireOwner, [
  param('jobId').isMongoId().withMessage('Invalid job ID')
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  // Verify job belongs to owner
  const job = await Job.findOne({
    _id: req.params.jobId,
    ownerId: req.user!.id
  });
  
  if (!job) {
    throw new ApiError(404, 'Job not found or unauthorized');
  }
  
  const { status, page = 1, limit = 20 } = req.query;
  
  const query: Record<string, unknown> = { jobId: req.params.jobId };
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [applications, total] = await Promise.all([
    Application.find(query)
      .populate({
        path: 'professionalId',
        select: 'name avatar phone skills experience location portfolio'
      })
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Application.countDocuments(query)
  ]);
  
  res.json({
    success: true,
    job: {
      id: job._id,
      title: job.title
    },
    applications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

/**
 * GET /api/applications/owner/all
 * Get all applications for owner's jobs
 */
router.get('/owner/all', authenticate, requireOwner, asyncHandler(async (req: Request, res: Response) => {
  const { status, page = 1, limit = 20 } = req.query;
  
  const query: Record<string, unknown> = { ownerId: req.user!.id };
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [applications, total] = await Promise.all([
    Application.find(query)
      .populate({
        path: 'jobId',
        select: 'title salonName status'
      })
      .populate({
        path: 'professionalId',
        select: 'name avatar phone skills experience'
      })
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Application.countDocuments(query)
  ]);
  
  res.json({
    success: true,
    applications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

/**
 * PUT /api/applications/:id/status
 * Update application status (owner action)
 */
router.put('/:id/status', authenticate, requireOwner, [
  param('id').isMongoId().withMessage('Invalid application ID'),
  body('status').isIn(['reviewed', 'shortlisted', 'interview', 'hired', 'rejected'])
    .withMessage('Invalid status'),
  body('note').optional().isLength({ max: 1000 })
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const application = await Application.findOne({
    _id: req.params.id,
    ownerId: req.user!.id
  });
  
  if (!application) {
    throw new ApiError(404, 'Application not found or unauthorized');
  }
  
  const { status, note, interviewDate, interviewLocation } = req.body;
  
  application.status = status;
  
  if (note) {
    application.ownerNote = note;
  }
  
  if (status === 'interview') {
    if (interviewDate) {
      application.interviewDate = new Date(interviewDate);
    }
    if (interviewLocation) {
      application.interviewLocation = interviewLocation;
    }
  }
  
  // Mark as viewed if not already
  if (!application.isViewed) {
    application.isViewed = true;
    application.viewedAt = new Date();
  }
  
  await application.save();
  
  res.json({
    success: true,
    message: `Application ${status}`,
    application
  });
}));

/**
 * GET /api/applications/:id
 * Get single application details
 */
router.get('/:id', authenticate, [
  param('id').isMongoId().withMessage('Invalid application ID')
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const application = await Application.findById(req.params.id)
    .populate({
      path: 'jobId',
      populate: {
        path: 'ownerId',
        select: 'name avatar salonName phone'
      }
    })
    .populate({
      path: 'professionalId',
      select: 'name avatar phone skills experience portfolio workHistory certifications location bio'
    });
  
  if (!application) {
    throw new ApiError(404, 'Application not found');
  }
  
  // Verify user has access (either professional or owner)
  const isOwner = application.ownerId.toString() === req.user!.id;
  const isProfessional = application.professionalId._id.toString() === req.user!.id;
  
  if (!isOwner && !isProfessional && req.user!.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to view this application');
  }
  
  // Mark as viewed if owner is viewing
  if (isOwner && !application.isViewed) {
    application.isViewed = true;
    application.viewedAt = new Date();
    await application.save();
  }
  
  res.json({
    success: true,
    application
  });
}));

export default router;
