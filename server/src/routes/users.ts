import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import User from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Helper to check validation results
const checkValidation = (req: Request): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg);
  }
};

// ============== USER PROFILE ==============

/**
 * GET /api/users/profile
 * Get current user's full profile
 */
router.get('/profile', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id)
    .populate('subscriptionId');
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  res.json({
    success: true,
    user
  });
}));

/**
 * PUT /api/users/profile
 * Update current user's profile
 */
router.put('/profile', authenticate, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio too long'),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('skills').optional().isArray(),
  body('experience').optional().isInt({ min: 0, max: 50 })
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const allowedFields = [
    'name', 'bio', 'gender', 'dateOfBirth', 'skills', 
    'experience', 'salonName', 'salonAddress', 'salonDescription'
  ];
  
  const updates: Record<string, unknown> = {};
  
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }
  
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    user
  });
}));

/**
 * PUT /api/users/location
 * Update user's location
 */
router.put('/location', authenticate, [
  body('coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates required'),
  body('coordinates.*').isFloat().withMessage('Invalid coordinates'),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('pincode').optional().trim()
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const { coordinates, address, city, state, pincode } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    {
      $set: {
        location: {
          type: 'Point',
          coordinates, // [longitude, latitude]
          address,
          city,
          state,
          pincode
        }
      }
    },
    { new: true }
  );
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  res.json({
    success: true,
    message: 'Location updated successfully',
    location: user.location
  });
}));

/**
 * POST /api/users/portfolio
 * Add portfolio item
 */
router.post('/portfolio', authenticate, [
  body('url').notEmpty().withMessage('Image URL required'),
  body('caption').optional().trim()
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const { url, caption } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    {
      $push: {
        portfolio: {
          id: `port-${Date.now()}`,
          url,
          caption,
          createdAt: new Date()
        }
      }
    },
    { new: true }
  );
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  res.status(201).json({
    success: true,
    message: 'Portfolio item added',
    portfolio: user.portfolio
  });
}));

/**
 * DELETE /api/users/portfolio/:itemId
 * Remove portfolio item
 */
router.delete('/portfolio/:itemId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    {
      $pull: { portfolio: { id: req.params.itemId } }
    },
    { new: true }
  );
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  res.json({
    success: true,
    message: 'Portfolio item removed',
    portfolio: user.portfolio
  });
}));

/**
 * POST /api/users/work-history
 * Add work experience
 */
router.post('/work-history', authenticate, [
  body('salonName').trim().notEmpty().withMessage('Salon name required'),
  body('role').trim().notEmpty().withMessage('Role required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').optional().isISO8601(),
  body('current').optional().isBoolean()
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const { salonName, role, startDate, endDate, current, description } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    {
      $push: {
        workHistory: {
          id: `work-${Date.now()}`,
          salonName,
          role,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : undefined,
          current: current || false,
          description
        }
      }
    },
    { new: true }
  );
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  res.status(201).json({
    success: true,
    message: 'Work experience added',
    workHistory: user.workHistory
  });
}));

/**
 * DELETE /api/users/work-history/:itemId
 * Remove work experience
 */
router.delete('/work-history/:itemId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    {
      $pull: { workHistory: { id: req.params.itemId } }
    },
    { new: true }
  );
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  res.json({
    success: true,
    message: 'Work experience removed',
    workHistory: user.workHistory
  });
}));

/**
 * POST /api/users/certifications
 * Add certification
 */
router.post('/certifications', authenticate, [
  body('name').trim().notEmpty().withMessage('Certification name required'),
  body('issuer').trim().notEmpty().withMessage('Issuer required'),
  body('issueDate').isISO8601().withMessage('Valid issue date required')
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const { name, issuer, issueDate, expiryDate, imageUrl } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    {
      $push: {
        certifications: {
          id: `cert-${Date.now()}`,
          name,
          issuer,
          issueDate: new Date(issueDate),
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          imageUrl
        }
      }
    },
    { new: true }
  );
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  res.status(201).json({
    success: true,
    message: 'Certification added',
    certifications: user.certifications
  });
}));

/**
 * DELETE /api/users/certifications/:itemId
 * Remove certification
 */
router.delete('/certifications/:itemId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    {
      $pull: { certifications: { id: req.params.itemId } }
    },
    { new: true }
  );
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  res.json({
    success: true,
    message: 'Certification removed',
    certifications: user.certifications
  });
}));

// ============== NOTIFICATIONS ==============

/**
 * GET /api/users/notifications
 * Get user's notifications
 */
router.get('/notifications', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [notifications, total] = await Promise.all([
    Notification.find({ userId: req.user!.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Notification.countDocuments({ userId: req.user!.id })
  ]);
  
  res.json({
    success: true,
    notifications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

/**
 * PUT /api/users/notifications/:id/read
 * Mark notification as read
 */
router.put('/notifications/:id/read', authenticate, [
  param('id').isMongoId().withMessage('Invalid notification ID')
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.id },
    { read: true },
    { new: true }
  );
  
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }
  
  res.json({
    success: true,
    notification
  });
}));

/**
 * PUT /api/users/notifications/read-all
 * Mark all notifications as read
 */
router.put('/notifications/read-all', authenticate, asyncHandler(async (req: Request, res: Response) => {
  await Notification.updateMany(
    { userId: req.user!.id, read: false },
    { read: true }
  );
  
  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
}));

/**
 * DELETE /api/users/notifications/:id
 * Delete a notification
 */
router.delete('/notifications/:id', authenticate, [
  param('id').isMongoId().withMessage('Invalid notification ID')
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user!.id
  });
  
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }
  
  res.json({
    success: true,
    message: 'Notification deleted'
  });
}));

// ============== PUBLIC USER PROFILES ==============

/**
 * GET /api/users/:id
 * Get public user profile
 */
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid user ID')
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const user = await User.findById(req.params.id)
    .select('name avatar bio role skills experience portfolio workHistory certifications salonName location createdAt');
  
  if (!user || !user.isActive) {
    throw new ApiError(404, 'User not found');
  }
  
  res.json({
    success: true,
    user
  });
}));

// ============== ADMIN USER MANAGEMENT ==============

/**
 * GET /api/users (admin)
 * List all users with filters
 */
router.get('/', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { 
    role, 
    isActive, 
    isVerified,
    search,
    page = 1, 
    limit = 20 
  } = req.query;
  
  const query: Record<string, unknown> = {};
  
  if (role && role !== 'all') {
    query.role = role;
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  if (isVerified !== undefined) {
    query.isVerified = isVerified === 'true';
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
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
 * PATCH /api/users/:id/status (admin)
 * Activate/deactivate user
 */
router.patch('/:id/status', authenticate, requireAdmin, [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('isActive').isBoolean().withMessage('isActive must be boolean')
], asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: req.body.isActive },
    { new: true }
  );
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  res.json({
    success: true,
    message: `User ${req.body.isActive ? 'activated' : 'deactivated'}`,
    user
  });
}));

export default router;
