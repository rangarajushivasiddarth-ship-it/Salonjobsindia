import { Router, Request, Response } from 'express';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Subscription from '../models/Subscription.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ============== DASHBOARD STATS ==============

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalUsers,
    totalProfessionals,
    totalOwners,
    activeUsers,
    totalJobs,
    activeJobs,
    totalApplications,
    pendingSubscriptions,
    activeSubscriptions,
    recentUsers,
    recentJobs
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: 'admin' } }),
    User.countDocuments({ role: 'professional' }),
    User.countDocuments({ role: 'owner' }),
    User.countDocuments({ role: { $ne: 'admin' }, isActive: true }),
    Job.countDocuments(),
    Job.countDocuments({ status: 'active' }),
    Application.countDocuments(),
    Subscription.countDocuments({ status: 'pending' }),
    Subscription.countDocuments({ status: 'active' }),
    User.find({ role: { $ne: 'admin' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name role createdAt avatar'),
    Job.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title salonName status createdAt')
  ]);
  
  // Get monthly stats for charts
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const monthlyUsers = await User.aggregate([
    {
      $match: {
        role: { $ne: 'admin' },
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  const monthlyJobs = await Job.aggregate([
    {
      $match: {
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  res.json({
    success: true,
    stats: {
      users: {
        total: totalUsers,
        professionals: totalProfessionals,
        owners: totalOwners,
        active: activeUsers
      },
      jobs: {
        total: totalJobs,
        active: activeJobs
      },
      applications: {
        total: totalApplications
      },
      subscriptions: {
        pending: pendingSubscriptions,
        active: activeSubscriptions
      }
    },
    recent: {
      users: recentUsers,
      jobs: recentJobs
    },
    charts: {
      monthlyUsers,
      monthlyJobs
    }
  });
}));

// ============== USER MANAGEMENT ==============

/**
 * GET /api/admin/users
 * Get all users with filters
 */
router.get('/users', asyncHandler(async (req: Request, res: Response) => {
  const { 
    role, 
    status,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1, 
    limit = 20 
  } = req.query;
  
  const query: Record<string, unknown> = {
    role: { $ne: 'admin' }
  };
  
  if (role && role !== 'all') {
    query.role = role;
  }
  
  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { salonName: { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  
  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ [sortBy as string]: sortDirection })
      .skip(skip)
      .limit(Number(limit))
      .select('-password'),
    User.countDocuments(query)
  ]);
  
  res.json({
    success: true,
    users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

/**
 * GET /api/admin/users/:id
 * Get user details
 */
router.get('/users/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('subscriptionId');
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  // Get user's activity stats
  let stats = {};
  
  if (user.role === 'professional') {
    const [totalApplications, hiredCount] = await Promise.all([
      Application.countDocuments({ professionalId: user._id }),
      Application.countDocuments({ professionalId: user._id, status: 'hired' })
    ]);
    stats = { totalApplications, hiredCount };
  } else if (user.role === 'owner') {
    const [totalJobs, activeJobs, totalApplicationsReceived] = await Promise.all([
      Job.countDocuments({ ownerId: user._id }),
      Job.countDocuments({ ownerId: user._id, status: 'active' }),
      Application.countDocuments({ ownerId: user._id })
    ]);
    stats = { totalJobs, activeJobs, totalApplicationsReceived };
  }
  
  res.json({
    success: true,
    user,
    stats
  });
}));

/**
 * PATCH /api/admin/users/:id/toggle-status
 * Toggle user active status
 */
router.patch('/users/:id/toggle-status', asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  if (user.role === 'admin') {
    throw new ApiError(400, 'Cannot modify admin status');
  }
  
  user.isActive = !user.isActive;
  await user.save();
  
  res.json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
    user
  });
}));

// ============== JOB MANAGEMENT ==============

/**
 * GET /api/admin/jobs
 * Get all jobs with filters
 */
router.get('/jobs', asyncHandler(async (req: Request, res: Response) => {
  const { 
    status,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1, 
    limit = 20 
  } = req.query;
  
  const query: Record<string, unknown> = {};
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { salonName: { $regex: search, $options: 'i' } },
      { 'location.city': { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  
  const [jobs, total] = await Promise.all([
    Job.find(query)
      .populate('ownerId', 'name phone salonName')
      .sort({ [sortBy as string]: sortDirection })
      .skip(skip)
      .limit(Number(limit)),
    Job.countDocuments(query)
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
}));

/**
 * PATCH /api/admin/jobs/:id/status
 * Update job status
 */
router.patch('/jobs/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  
  if (!['active', 'paused', 'closed', 'expired'].includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }
  
  const job = await Job.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }
  
  res.json({
    success: true,
    message: `Job status updated to ${status}`,
    job
  });
}));

/**
 * PATCH /api/admin/jobs/:id/feature
 * Toggle job featured status
 */
router.patch('/jobs/:id/feature', asyncHandler(async (req: Request, res: Response) => {
  const job = await Job.findById(req.params.id);
  
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }
  
  job.isFeatured = !job.isFeatured;
  await job.save();
  
  res.json({
    success: true,
    message: `Job ${job.isFeatured ? 'featured' : 'unfeatured'}`,
    job
  });
}));

/**
 * DELETE /api/admin/jobs/:id
 * Delete a job
 */
router.delete('/jobs/:id', asyncHandler(async (req: Request, res: Response) => {
  const job = await Job.findByIdAndDelete(req.params.id);
  
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }
  
  // Delete related applications
  await Application.deleteMany({ jobId: job._id });
  
  res.json({
    success: true,
    message: 'Job deleted successfully'
  });
}));

// ============== APPLICATION MANAGEMENT ==============

/**
 * GET /api/admin/applications
 * Get all applications
 */
router.get('/applications', asyncHandler(async (req: Request, res: Response) => {
  const { 
    status,
    page = 1, 
    limit = 20 
  } = req.query;
  
  const query: Record<string, unknown> = {};
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [applications, total] = await Promise.all([
    Application.find(query)
      .populate('jobId', 'title salonName')
      .populate('professionalId', 'name phone')
      .populate('ownerId', 'name salonName')
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

export default router;
