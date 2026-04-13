import { Router, Request, Response } from 'express';
import { put, del } from '@vercel/blob';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    // Allow images and PDFs
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  }
});

// Image-only filter
const imageFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'));
  }
};

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for images
  fileFilter: imageFilter
});

/**
 * Generate a unique filename
 */
const generateFilename = (userId: string, originalName: string, category: string): string => {
  const timestamp = Date.now();
  const ext = originalName.split('.').pop() || 'jpg';
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 30);
  return `${category}/${userId}/${timestamp}-${sanitizedName}`;
};

// ============== UPLOAD ENDPOINTS ==============

/**
 * POST /api/uploads/avatar
 * Upload user avatar
 */
router.post('/avatar', authenticate, imageUpload.single('avatar'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }
  
  const filename = generateFilename(req.user!.id, req.file.originalname, 'avatars');
  
  try {
    const blob = await put(filename, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    
    res.json({
      success: true,
      url: blob.url,
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    console.error('Blob upload error:', error);
    throw new ApiError(500, 'Failed to upload file');
  }
}));

/**
 * POST /api/uploads/portfolio
 * Upload portfolio image
 */
router.post('/portfolio', authenticate, imageUpload.single('image'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }
  
  const filename = generateFilename(req.user!.id, req.file.originalname, 'portfolio');
  
  try {
    const blob = await put(filename, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    
    res.json({
      success: true,
      url: blob.url,
      message: 'Portfolio image uploaded successfully'
    });
  } catch (error) {
    console.error('Blob upload error:', error);
    throw new ApiError(500, 'Failed to upload file');
  }
}));

/**
 * POST /api/uploads/certification
 * Upload certification image
 */
router.post('/certification', authenticate, imageUpload.single('image'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }
  
  const filename = generateFilename(req.user!.id, req.file.originalname, 'certifications');
  
  try {
    const blob = await put(filename, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    
    res.json({
      success: true,
      url: blob.url,
      message: 'Certification image uploaded successfully'
    });
  } catch (error) {
    console.error('Blob upload error:', error);
    throw new ApiError(500, 'Failed to upload file');
  }
}));

/**
 * POST /api/uploads/payment-screenshot
 * Upload payment screenshot for subscription
 */
router.post('/payment-screenshot', authenticate, imageUpload.single('screenshot'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }
  
  const filename = generateFilename(req.user!.id, req.file.originalname, 'payments');
  
  try {
    const blob = await put(filename, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    
    res.json({
      success: true,
      url: blob.url,
      message: 'Payment screenshot uploaded successfully'
    });
  } catch (error) {
    console.error('Blob upload error:', error);
    throw new ApiError(500, 'Failed to upload file');
  }
}));

/**
 * POST /api/uploads/resume
 * Upload resume (PDF or image)
 */
router.post('/resume', authenticate, upload.single('resume'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }
  
  const filename = generateFilename(req.user!.id, req.file.originalname, 'resumes');
  
  try {
    const blob = await put(filename, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    
    res.json({
      success: true,
      url: blob.url,
      message: 'Resume uploaded successfully'
    });
  } catch (error) {
    console.error('Blob upload error:', error);
    throw new ApiError(500, 'Failed to upload file');
  }
}));

/**
 * POST /api/uploads/salon-logo
 * Upload salon logo (for owners)
 */
router.post('/salon-logo', authenticate, imageUpload.single('logo'), asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== 'owner' && req.user!.role !== 'admin') {
    throw new ApiError(403, 'Only salon owners can upload salon logos');
  }
  
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }
  
  const filename = generateFilename(req.user!.id, req.file.originalname, 'salon-logos');
  
  try {
    const blob = await put(filename, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    
    res.json({
      success: true,
      url: blob.url,
      message: 'Salon logo uploaded successfully'
    });
  } catch (error) {
    console.error('Blob upload error:', error);
    throw new ApiError(500, 'Failed to upload file');
  }
}));

/**
 * DELETE /api/uploads
 * Delete a file by URL
 */
router.delete('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.body;
  
  if (!url) {
    throw new ApiError(400, 'File URL is required');
  }
  
  // Verify user owns this file (check if URL contains user ID)
  if (!url.includes(req.user!.id) && req.user!.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to delete this file');
  }
  
  try {
    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Blob delete error:', error);
    throw new ApiError(500, 'Failed to delete file');
  }
}));

/**
 * POST /api/uploads/multiple
 * Upload multiple files at once
 */
router.post('/multiple', authenticate, imageUpload.array('images', 10), asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    throw new ApiError(400, 'No files uploaded');
  }
  
  const category = req.body.category || 'misc';
  const uploadedFiles: { url: string; originalName: string }[] = [];
  
  try {
    for (const file of files) {
      const filename = generateFilename(req.user!.id, file.originalname, category);
      
      const blob = await put(filename, file.buffer, {
        access: 'public',
        contentType: file.mimetype,
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      
      uploadedFiles.push({
        url: blob.url,
        originalName: file.originalname
      });
    }
    
    res.json({
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} files uploaded successfully`
    });
  } catch (error) {
    console.error('Blob upload error:', error);
    throw new ApiError(500, 'Failed to upload files');
  }
}));

export default router;
