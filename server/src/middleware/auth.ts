import { Request, Response, NextFunction } from 'express';
import { verifyToken, DecodedToken } from '../utils/jwt.js';
import User from '../models/User.js';
import { ApiError } from './errorHandler.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'professional' | 'owner' | 'admin';
      };
      token?: string;
    }
  }
}

// Authenticate user from JWT token
export const authenticate = async (
  req: Request, 
  _res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new ApiError(401, 'Authentication token not provided');
    }

    let decoded: DecodedToken;
    try {
      decoded = verifyToken(token, 'access');
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    // Verify user still exists and is active
    const user = await User.findById(decoded.userId).select('_id role isActive isVerified');
    
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account has been deactivated');
    }

    req.user = {
      id: user._id.toString(),
      role: user.role
    };
    req.token = token;

    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (
  req: Request, 
  _res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }

    try {
      const decoded = verifyToken(token, 'access');
      const user = await User.findById(decoded.userId).select('_id role isActive');
      
      if (user && user.isActive) {
        req.user = {
          id: user._id.toString(),
          role: user.role
        };
        req.token = token;
      }
    } catch {
      // Token invalid, but that's ok for optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Require specific role(s)
export const requireRole = (...allowedRoles: ('professional' | 'owner' | 'admin')[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }

    next();
  };
};

// Require admin role
export const requireAdmin = requireRole('admin');

// Require owner role
export const requireOwner = requireRole('owner', 'admin');

// Require professional role
export const requireProfessional = requireRole('professional', 'admin');

// Require verified account
export const requireVerified = async (
  req: Request, 
  _res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    const user = await User.findById(req.user.id).select('isVerified');
    
    if (!user || !user.isVerified) {
      throw new ApiError(403, 'Please verify your account to continue');
    }

    next();
  } catch (error) {
    next(error);
  }
};
