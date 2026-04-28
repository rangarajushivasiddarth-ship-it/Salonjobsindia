import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import User from '../models/User.js';
import { authenticate, optionalAuth, requireOwner } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Helper to check validation results
const checkValidation = (req: Request): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg);
  }
};

// Job validation
const jobValidation = [
  body('title').trim().notEmpty().withMessage('Job title required'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('jobType').isIn(['full-time', 'part-time', 'contract', 'freelance']),
  body('skills').isArray({ min: 1 }).withMessage('At least one skill required'),
  body('salary.min').isInt({ min: 0 }).withMessage('Invalid minimum salary'),
  body('salary.max').isInt({ min: 0 }).withMessage('Invalid maximum salary'),
  body('location.coordinates').isArray({ min: 2, max: 2 }),
  body('location.address').trim().notEmpty().withMessage('Address required'),
  body('location.city').trim().notEmpty().withMessage('City required')
];

// ============== PUBLIC JOB ENDPOINTS ==============

/**
 * GET /api/jobs
 * List active jobs with filters and geospatial search
 */
router.get('/', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    skills,
    jobType,
    city,
    minSalary,
    maxSalary,
    lat,
    lng,
    radius = 25, // km
    page = 1,
    limit = 20,
    sort = 'recent'
  } = req.query;
  
  // Base query for active jobs
  const matchQuery: Record<string, unknown> = {
    status: 'active'
  };
  
  // Text search
  if (search) {
    matchQuery.$text = { $search: search as string };
  }
  
  // Skills filter
  if (skills) {
    const skillsArray = (skills as string).split(',').map(s => s.trim());
    matchQuery.skills = { $in: skillsArray };
  }
  
  // Job type filter
  if (jobType && jobType !== 'all') {
    matchQuery.jobType = jobType;
  }
  
  // City filter
  if (city) {
    matchQuery['location.city'] = { $regex: city, $options: 'i' };
  }
  
  // Salary filters
  if (minSalary) {
    matchQuery['salary.max'] = { $gte: Number(minSalary) };
  }
  if (maxSalary) {
    matchQuery['salary.min'] = { $lte: Number(maxSalary) };
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  // If location provided, use geospatial query
  if (lat && lng) {
    const radiusInMeters = Number(radius) * 1000;
    
    const jobs = await Job.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          },
          distanceField: 'distance',
          maxDistance: radiusInMeters,
          query: matchQuery,
          spherical: true
        }
      },
      {
        $addFields: {
          distanceKm: { $divide: ['$distance', 1000] }
        }
      },
      { $sort: sort === 'distance' ? { distance: 1 } : { postedAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) }
    ]);
    
    // Get total count for pagination
    const countResult = await Job.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          },
          distanceField: 'distance',
          maxDistance: radiusInMeters,
          query: matchQuery,
          spherical: true
        }
      },
      { $count: 'total' }
    ]);
    
    const total = countResult[0]?.total || 0;
    
    res.json({
      success: true,
      jobs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } else {
    // Non-geospatial query
    let sortOption: Record<string, 1 | -1> = { postedAt: -1 };
    if (sort === 'salary-high') sortOption = { 'salary.max': -1 };
    if (sort === 'salary-low') sortOption = { 'salary.min': 1 };
    
    const [jobs, total] = await Promise.all([
      Job.find(matchQuery)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .populate('ownerId', 'name avatar salonName'),
      Job.countDocuments(matchQuery)
    ]);
    
    res.json({
      success: true,
      jobs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  }
}));

/**
 * GET /api/jobs/nearby
 * Get jobs near a location (simplified endpoint)
 */
router.get('/nearby', [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required')
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const { lat, lng, radius = 25, limit = 10 } = req.query;
  const radiusInMeters = Number(radius) * 1000;
  
  const jobs = await Job.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [Number(lng), Number(lat)]
        },
        distanceField: 'distance',
        maxDistance: radiusInMeters,
        query: { status: 'active' },
        spherical: true
      }
    },
    {
      $addFields: {
        distanceKm: { $round: [{ $divide: ['$distance', 1000] }, 1] }
      }
    },
    { $sort: { distance: 1 } },
    { $limit: Number(limit) }
  ]);
  
  res.json({
    success: true,
    jobs
  });
}));

/**
 * GET /api/jobs/featured
 * Get featured and urgent jobs
 */
router.get('/featured', asyncHandler(async (_req: Request, res: Response) => {
  const [featuredJobs, urgentJobs] = await Promise.all([
    Job.find({ status: 'active', isFeatured: true })
      .sort({ postedAt: -1 })
      .limit(6)
      .populate('ownerId', 'name avatar salonName'),
    Job.find({ status: 'active', isUrgent: true })
      .sort({ postedAt: -1 })
      .limit(6)
      .populate('ownerId', 'name avatar salonName')
  ]);
  
  res.json({
    success: true,
    featuredJobs,
    urgentJobs
  });
}));

/**
 * GET /api/jobs/:id
 * Get single job details
 */
router.get('/:id', optionalAuth, [
  param('id').isMongoId().withMessage('Invalid job ID')
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const job = await Job.findById(req.params.id)
    .populate('ownerId', 'name avatar salonName phone location');
  
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }
  
  // Increment view count
  await Job.updateOne({ _id: job._id }, { $inc: { viewCount: 1 } });
  
  // Check if current user has applied
  let hasApplied = false;
  if (req.user) {
    const application = await Application.findOne({
      jobId: job._id,
      professionalId: req.user.id
    });
    hasApplied = !!application;
  }
  
  res.json({
    success: true,
    job,
    hasApplied
  });
}));

// ============== OWNER JOB MANAGEMENT ==============

/**
 * POST /api/jobs
 * Create a new job posting
 */
router.post('/', authenticate, requireOwner, jobValidation, asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const owner = await User.findById(req.user!.id);
  
  if (!owner) {
    throw new ApiError(404, 'Owner not found');
  }
  
  // Check subscription limits (if applicable)
  // TODO: Add subscription checking logic
  
  const jobData = {
    ...req.body,
    ownerId: req.user!.id,
    salonName: owner.salonName || owner.name,
    salonLogo: owner.avatar,
    status: 'active',
    postedAt: new Date()
  };
  
  // Ensure location has proper format
  jobData.location = {
    type: 'Point',
    ...req.body.location
  };
  
  const job = new Job(jobData);
  await job.save();
  
  res.status(201).json({
    success: true,
    message: 'Job posted successfully',
    job
  });
}));

/**
 * GET /api/jobs/my-jobs
 * Get owner's job postings
 */
router.get('/owner/my-jobs', authenticate, requireOwner, asyncHandler(async (req: Request, res: Response) => {
  const { status, page = 1, limit = 20 } = req.query;
  
  const query: Record<string, unknown> = { ownerId: req.user!.id };
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [jobs, total] = await Promise.all([
    Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Job.countDocuments(query)
  ]);
  
  // Get application counts for each job
  const jobsWithCounts = await Promise.all(
    jobs.map(async (job) => {
      const applicationCount = await Application.countDocuments({ jobId: job._id });
      const pendingCount = await Application.countDocuments({ 
        jobId: job._id, 
        status: 'pending' 
      });
      return {
        ...job.toObject(),
        applicationCount,
        pendingCount
      };
    })
  );
  
  res.json({
    success: true,
    jobs: jobsWithCounts,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

/**
 * PUT /api/jobs/:id
 * Update a job posting
 */
router.put('/:id', authenticate, requireOwner, [
  param('id').isMongoId().withMessage('Invalid job ID')
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const job = await Job.findOne({ 
    _id: req.params.id, 
    ownerId: req.user!.id 
  });
  
  if (!job) {
    throw new ApiError(404, 'Job not found or unauthorized');
  }
  
  // Fields that can be updated
  const allowedUpdates = [
    'title', 'description', 'jobType', 'skills', 'experienceRequired',
    'salary', 'location', 'requirements', 'benefits', 'status',
    'isUrgent', 'expiresAt'
  ];
  
  for (const field of allowedUpdates) {
    if (req.body[field] !== undefined) {
      (job as unknown as Record<string, unknown>)[field] = req.body[field];
    }
  }
  
  // Ensure location format
  if (req.body.location) {
    job.location = {
      type: 'Point',
      ...req.body.location
    };
  }
  
  await job.save();
  
  res.json({
    success: true,
    message: 'Job updated successfully',
    job
  });
}));

/**
 * PATCH /api/jobs/:id/status
 * Update job status
 */
router.patch('/:id/status', authenticate, requireOwner, [
  param('id').isMongoId().withMessage('Invalid job ID'),
  body('status').isIn(['active', 'paused', 'closed']).withMessage('Invalid status')
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const job = await Job.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user!.id },
    { status: req.body.status },
    { new: true }
  );
  
  if (!job) {
    throw new ApiError(404, 'Job not found or unauthorized');
  }
  
  res.json({
    success: true,
    message: `Job ${req.body.status}`,
    job
  });
}));

/**
 * DELETE /api/jobs/:id
 * Delete a job posting
 */
router.delete('/:id', authenticate, requireOwner, [
  param('id').isMongoId().withMessage('Invalid job ID')
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const job = await Job.findOneAndDelete({ 
    _id: req.params.id, 
    ownerId: req.user!.id 
  });
  
  if (!job) {
    throw new ApiError(404, 'Job not found or unauthorized');
  }
  
  // Also delete related applications
  await Application.deleteMany({ jobId: job._id });
  
  res.json({
    success: true,
    message: 'Job deleted successfully'
  });
}));

export default router;
