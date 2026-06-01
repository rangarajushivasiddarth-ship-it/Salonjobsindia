// Uploads API services - Client-side file handling using localStorage and Blob URLs

import { getAccessToken } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface UploadResponse {
  success: boolean;
  url: string;
  message: string;
}

export interface MultipleUploadResponse {
  success: boolean;
  files: Array<{ url: string; originalName: string }>;
  message: string;
}

// Store files locally using Blob URLs (no server upload needed)
const createLocalFileUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

// Generic upload function - uses local Blob URLs
const uploadFile = async (
  endpoint: string,
  file: File,
  fieldName: string
): Promise<UploadResponse> => {
  try {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'File validation failed');
    }

    // Create local Blob URL instead of uploading to server
    const url = createLocalFileUrl(file);

    return {
      success: true,
      url,
      message: `File ${file.name} processed locally`
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    throw new Error(errorMessage);
  }
};

// Upload avatar
export const uploadAvatar = async (file: File): Promise<UploadResponse> => {
  return uploadFile('/uploads/avatar', file, 'avatar');
};

// Upload portfolio image
export const uploadPortfolioImage = async (file: File): Promise<UploadResponse> => {
  return uploadFile('/uploads/portfolio', file, 'image');
};

// Upload certification image
export const uploadCertificationImage = async (file: File): Promise<UploadResponse> => {
  return uploadFile('/uploads/certification', file, 'image');
};

// Upload payment screenshot
export const uploadPaymentScreenshot = async (file: File): Promise<UploadResponse> => {
  return uploadFile('/uploads/payment-screenshot', file, 'screenshot');
};

// Upload resume
export const uploadResume = async (file: File): Promise<UploadResponse> => {
  return uploadFile('/uploads/resume', file, 'resume');
};

// Upload salon logo
export const uploadSalonLogo = async (file: File): Promise<UploadResponse> => {
  return uploadFile('/uploads/salon-logo', file, 'logo');
};

// Upload multiple images
export const uploadMultipleImages = async (
  files: File[],
  category: string
): Promise<MultipleUploadResponse> => {
  try {
    const uploadedFiles = files.map((file) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error || 'File validation failed');
      }

      const url = createLocalFileUrl(file);
      return {
        url,
        originalName: file.name
      };
    });

    return {
      success: true,
      files: uploadedFiles,
      message: `${files.length} files processed locally`
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    throw new Error(errorMessage);
  }
};

// Delete a file - revoke Blob URL
export const deleteFile = async (url: string): Promise<{ success: boolean; message: string }> => {
  try {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
    return { success: true, message: 'File deleted' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Delete failed';
    return { success: false, message: errorMessage };
  }
};

// Helper to validate file before upload
export const validateFile = (
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } => {
  const { maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'] } = options;

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }

  return { valid: true };
};

