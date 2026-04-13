import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { generateTokenPair, verifyToken } from '../utils/jwt.js';
import { generateOTP, getOTPExpiry, isOTPValid, sendOTP, formatPhone, isValidIndianPhone } from '../services/otp.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Validation middleware
const validatePhone = [
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .custom((value) => {
      if (!isValidIndianPhone(value)) {
        throw new Error('Please enter a valid Indian phone number');
      }
      return true;
    })
];

const validateOTP = [
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers')
];

const validateRegistration = [
  ...validatePhone,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role')
    .isIn(['professional', 'owner'])
    .withMessage('Role must be professional or owner')
];

const validateAdminLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Helper to check validation results
const checkValidation = (req: Request): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg);
  }
};

// ============== PROFESSIONAL/OWNER AUTHENTICATION ==============

/**
 * POST /api/auth/send-otp
 * Send OTP to phone number for login/registration
 */
router.post('/send-otp', validatePhone, asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const phone = formatPhone(req.body.phone);
  
  // Generate OTP
  const otp = generateOTP();
  const otpExpiry = getOTPExpiry();
  
  // Check if user exists
  let user = await User.findOne({ phone });
  
  if (user) {
    // Update existing user's OTP
    await User.updateOne(
      { phone },
      { $set: { otp, otpExpiry } }
    );
  } else {
    // Store OTP temporarily (user will complete registration after verification)
    // We create a temporary entry that will be updated during registration
    user = new User({
      phone,
      name: 'Pending',
      role: 'professional', // Temporary, will be updated
      otp,
      otpExpiry,
      isVerified: false
    });
    await user.save();
  }
  
  // Send OTP
  const sent = await sendOTP(phone, otp);
  
  if (!sent) {
    throw new ApiError(500, 'Failed to send OTP. Please try again.');
  }
  
  res.json({ 
    success: true, 
    message: 'OTP sent successfully',
    isNewUser: !user.isVerified
  });
}));

/**
 * POST /api/auth/verify-otp
 * Verify OTP and return tokens (for existing users)
 */
router.post('/verify-otp', validateOTP, asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const phone = formatPhone(req.body.phone);
  const { otp } = req.body;
  
  const user = await User.findOne({ phone }).select('+otp +otpExpiry');
  
  if (!user) {
    throw new ApiError(404, 'User not found. Please register first.');
  }
  
  if (!user.otp || !user.otpExpiry) {
    throw new ApiError(400, 'No OTP found. Please request a new OTP.');
  }
  
  if (!isOTPValid(user.otpExpiry)) {
    throw new ApiError(400, 'OTP has expired. Please request a new OTP.');
  }
  
  if (user.otp !== otp) {
    throw new ApiError(400, 'Invalid OTP. Please try again.');
  }
  
  // Clear OTP and mark as verified
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.isVerified = true;
  await user.save();
  
  // If user hasn't completed registration (name is still 'Pending')
  if (user.name === 'Pending') {
    res.json({
      success: true,
      requiresRegistration: true,
      phone
    });
    return;
  }
  
  // Generate tokens
  const tokens = generateTokenPair(user._id.toString(), user.role);
  
  res.json({
    success: true,
    requiresRegistration: false,
    user: {
      id: user._id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified
    },
    ...tokens
  });
}));

/**
 * POST /api/auth/register
 * Complete registration after OTP verification
 */
router.post('/register', validateRegistration, asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const phone = formatPhone(req.body.phone);
  const { name, role, salonName, salonAddress } = req.body;
  
  // Find user with verified phone
  const user = await User.findOne({ phone, isVerified: true });
  
  if (!user) {
    throw new ApiError(400, 'Please verify your phone number first.');
  }
  
  // Update user details
  user.name = name;
  user.role = role;
  
  if (role === 'owner') {
    user.salonName = salonName;
    user.salonAddress = salonAddress;
  }
  
  await user.save();
  
  // Generate tokens
  const tokens = generateTokenPair(user._id.toString(), user.role);
  
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    user: {
      id: user._id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      salonName: user.salonName,
      isVerified: user.isVerified
    },
    ...tokens
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token is required');
  }
  
  let decoded;
  try {
    decoded = verifyToken(refreshToken, 'refresh');
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
  
  const user = await User.findById(decoded.userId);
  
  if (!user || !user.isActive) {
    throw new ApiError(401, 'User not found or inactive');
  }
  
  // Generate new token pair
  const tokens = generateTokenPair(user._id.toString(), user.role);
  
  res.json({
    success: true,
    ...tokens
  });
}));

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  res.json({
    success: true,
    user
  });
}));

/**
 * POST /api/auth/logout
 * Logout (client should discard tokens)
 */
router.post('/logout', authenticate, (_req: Request, res: Response) => {
  // In a more complex setup, you might blacklist the token here
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ============== ADMIN AUTHENTICATION ==============

/**
 * POST /api/auth/admin/login
 * Admin login with email and password
 */
router.post('/admin/login', validateAdminLogin, asyncHandler(async (req: Request, res: Response) => {
  checkValidation(req);
  
  const { email, password } = req.body;
  
  const admin = await User.findOne({ 
    email: email.toLowerCase(), 
    role: 'admin' 
  }).select('+password');
  
  if (!admin) {
    throw new ApiError(401, 'Invalid email or password');
  }
  
  const isMatch = await admin.comparePassword(password);
  
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }
  
  if (!admin.isActive) {
    throw new ApiError(403, 'Account has been deactivated');
  }
  
  // Generate tokens
  const tokens = generateTokenPair(admin._id.toString(), 'admin');
  
  res.json({
    success: true,
    user: {
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      adminPermissions: admin.adminPermissions
    },
    ...tokens
  });
}));

/**
 * POST /api/auth/admin/create
 * Create a new admin (requires setup key or existing admin)
 */
router.post('/admin/create', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, setupKey } = req.body;
  
  // Check if this is initial setup or admin-created
  const adminCount = await User.countDocuments({ role: 'admin' });
  
  if (adminCount === 0) {
    // First admin - requires setup key
    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      throw new ApiError(403, 'Invalid setup key');
    }
  } else {
    // Subsequent admins - requires existing admin auth
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Admin authentication required');
    }
    
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyToken(token, 'access');
      if (decoded.role !== 'admin') {
        throw new ApiError(403, 'Only admins can create other admins');
      }
    } catch {
      throw new ApiError(401, 'Invalid admin token');
    }
  }
  
  // Check if email already exists
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(400, 'Email already registered');
  }
  
  // Create admin
  const admin = new User({
    email: email.toLowerCase(),
    password,
    name,
    phone: `admin-${Date.now()}`, // Placeholder phone for admins
    role: 'admin',
    isVerified: true,
    isActive: true,
    adminPermissions: ['all']
  });
  
  await admin.save();
  
  res.status(201).json({
    success: true,
    message: 'Admin created successfully',
    admin: {
      id: admin._id,
      email: admin.email,
      name: admin.name
    }
  });
}));

export default router;
