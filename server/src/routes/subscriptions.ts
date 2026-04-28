import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { getPlanById, getPlansForRole, professionalPlans, ownerPlans } from '../config/subscriptionPlans.js';

const router = Router();

// Helper to check validation results
const checkValidation = (req: Request): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg);
  }
};

// ============== PUBLIC ENDPOINTS ==============

/**
 * GET /api/subscriptions/plans
 * Get available subscription plans
 */
router.get('/plans', (req: Request, res: Response) => {
  const { role } = req.query;
  
  if (role === 'professional') {
    res.json({ success: true, plans: professionalPlans });
  } else if (role === 'owner') {
    res.json({ success: true, plans: ownerPlans });
  } else {
    res.json({ 
      success: true, 
      professionalPlans, 
      ownerPlans 
    });
  }
});

/**
 * GET /api/subscriptions/plans/:planId
 * Get specific plan details
 */
router.get('/plans/:planId', (req: Request, res: Response) => {
  const planId = Array.isArray(req.params.planId) ? req.params.planId[0] : req.params.planId;
  const plan = getPlanById(planId);
  
  if (!plan) {
    throw new ApiError(404, 'Plan not found');
  }
  
  res.json({ success: true, plan });
});

// ============== USER ENDPOINTS ==============

/**
 * GET /api/subscriptions/my-subscription
 * Get current user's subscription
 */
router.get('/my-subscription', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id)
    .select('subscriptionId subscriptionStatus');
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  let subscription = null;
  
  if (user.subscriptionId) {
    subscription = await Subscription.findById(user.subscriptionId);
  }
  
  res.json({
    success: true,
    subscriptionStatus: user.subscriptionStatus,
    subscription
  });
}));

/**
 * POST /api/subscriptions/subscribe
 * Create a new subscription request
 */
router.post('/subscribe', authenticate, [
  body('planId').notEmpty().withMessage('Plan ID required'),
  body('paymentMethod').isIn(['upi', 'bank_transfer', 'cash', 'other'])
    .withMessage('Invalid payment method'),
  body('screenshotUrl').notEmpty().withMessage('Payment screenshot required')
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const { planId, paymentMethod, screenshotUrl, transactionId, note } = req.body;
  
  // Get plan details
  const plan = getPlanById(planId);
  
  if (!plan) {
    throw new ApiError(404, 'Plan not found');
  }
  
  const user = await User.findById(req.user!.id);
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  // Check if plan is for user's role
  if (plan.forRole !== user.role && plan.forRole !== 'both') {
    throw new ApiError(400, 'This plan is not available for your account type');
  }
  
  // Check for existing pending subscription
  const existingPending = await Subscription.findOne({
    userId: req.user!.id,
    status: 'pending'
  });
  
  if (existingPending) {
    throw new ApiError(400, 'You already have a pending subscription request');
  }
  
  // Create subscription
  const subscription = new Subscription({
    userId: req.user!.id,
    userRole: user.role,
    planId: plan.id,
    planName: plan.name,
    planType: plan.type,
    amount: plan.price,
    currency: plan.currency,
    duration: plan.duration,
    features: plan.features,
    status: plan.price === 0 ? 'active' : 'pending', // Free plans are auto-activated
    paymentProof: plan.price > 0 ? {
      screenshotUrl,
      uploadedAt: new Date(),
      transactionId,
      paymentMethod,
      note
    } : undefined,
    startDate: plan.price === 0 ? new Date() : undefined,
    endDate: plan.price === 0 ? new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000) : undefined
  });
  
  await subscription.save();
  
  // Update user
  user.subscriptionId = subscription._id as typeof user.subscriptionId;
  // Map subscription status to user subscription status (only valid values)
  const statusMap: Record<string, 'pending' | 'active' | 'expired' | 'none'> = {
    'pending': 'pending',
    'active': 'active',
    'expired': 'expired',
    'rejected': 'none',
    'cancelled': 'none'
  };
  user.subscriptionStatus = statusMap[subscription.status] || 'none';
  await user.save();
  
  res.status(201).json({
    success: true,
    message: plan.price === 0 
      ? 'Free plan activated successfully' 
      : 'Subscription request submitted. Awaiting admin approval.',
    subscription
  });
}));

/**
 * GET /api/subscriptions/history
 * Get user's subscription history
 */
router.get('/history', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const subscriptions = await Subscription.find({ userId: req.user!.id })
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    subscriptions
  });
}));

// ============== ADMIN ENDPOINTS ==============

/**
 * GET /api/subscriptions/pending
 * Get all pending subscription requests
 */
router.get('/pending', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [subscriptions, total] = await Promise.all([
    Subscription.find({ status: 'pending' })
      .populate('userId', 'name phone email role avatar')
      .sort({ createdAt: 1 }) // Oldest first for FIFO processing
      .skip(skip)
      .limit(Number(limit)),
    Subscription.countDocuments({ status: 'pending' })
  ]);
  
  res.json({
    success: true,
    subscriptions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

/**
 * PUT /api/subscriptions/:id/approve
 * Approve a subscription
 */
router.put('/:id/approve', authenticate, requireAdmin, [
  param('id').isMongoId().withMessage('Invalid subscription ID'),
  body('note').optional().isLength({ max: 500 })
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const subscription = await Subscription.findById(req.params.id);
  
  if (!subscription) {
    throw new ApiError(404, 'Subscription not found');
  }
  
  if (subscription.status !== 'pending') {
    throw new ApiError(400, 'Subscription is not pending');
  }
  
  // Update subscription
  subscription.status = 'active';
  subscription.reviewedBy = req.user!.id as unknown as typeof subscription.reviewedBy;
  subscription.reviewedAt = new Date();
  subscription.reviewNote = req.body.note;
  subscription.startDate = new Date();
  subscription.endDate = new Date(Date.now() + subscription.duration * 24 * 60 * 60 * 1000);
  
  await subscription.save();
  
  // Update user
  await User.updateOne(
    { _id: subscription.userId },
    { 
      subscriptionId: subscription._id,
      subscriptionStatus: 'active'
    }
  );
  
  res.json({
    success: true,
    message: 'Subscription approved',
    subscription
  });
}));

/**
 * PUT /api/subscriptions/:id/reject
 * Reject a subscription
 */
router.put('/:id/reject', authenticate, requireAdmin, [
  param('id').isMongoId().withMessage('Invalid subscription ID'),
  body('reason').notEmpty().withMessage('Rejection reason required')
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const subscription = await Subscription.findById(req.params.id);
  
  if (!subscription) {
    throw new ApiError(404, 'Subscription not found');
  }
  
  if (subscription.status !== 'pending') {
    throw new ApiError(400, 'Subscription is not pending');
  }
  
  // Update subscription
  subscription.status = 'rejected';
  subscription.reviewedBy = req.user!.id as unknown as typeof subscription.reviewedBy;
  subscription.reviewedAt = new Date();
  subscription.rejectionReason = req.body.reason;
  
  await subscription.save();
  
  // Update user status
  await User.updateOne(
    { _id: subscription.userId },
    { subscriptionStatus: 'none' }
  );
  
  res.json({
    success: true,
    message: 'Subscription rejected',
    subscription
  });
}));

/**
 * GET /api/subscriptions/all
 * Get all subscriptions (admin)
 */
router.get('/all', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { status, page = 1, limit = 20 } = req.query;
  
  const query: Record<string, unknown> = {};
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [subscriptions, total] = await Promise.all([
    Subscription.find(query)
      .populate('userId', 'name phone email role avatar')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Subscription.countDocuments(query)
  ]);
  
  res.json({
    success: true,
    subscriptions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

export default router;
