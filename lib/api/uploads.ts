// Uploads API services - Using Vercel Blob for persistent file storage

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

// Upload file to Vercel Blob storage for persistence
const uploadFileToBlob = async (
  file: File,
  category: string
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const data = await response.json();
    return data.url; // Returns persistent Blob URL
  } catch (error) {
    console.error('[v0] Upload error:', error);
    // Fallback to local Blob URL if server upload fails
    return URL.createObjectURL(file);
  }
};

// Generic upload function - uses Vercel Blob storage
const uploadFile = async (
  endpoint: string,
  file: File,
  category: string
): Promise<UploadResponse> => {
  try {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'File validation failed');
    }

    // Upload to Vercel Blob for persistence
    const url = await uploadFileToBlob(file, category);

    return {
      success: true,
      url,
      message: `File ${file.name} uploaded successfully`
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    throw new Error(errorMessage, { cause: error });
  }
};

// Upload avatar
export const uploadAvatar = async (file: File): Promise<UploadResponse> => {
  return uploadFile('/uploads/avatar', file, 'avatar');
};

// Upload portfolio image
export const uploadPortfolioImage = async (file: File): Promise<UploadResponse> => {
  return uploadFile('/uploads/portfolio', file, 'portfolio');
};

// Upload certification image
export const uploadCertificationImage = async (file: File): Promise<UploadResponse> => {
  return uploadFile('/uploads/certification', file, 'certification');
};

// Upload payment screenshot
export const uploadPaymentScreenshot = async (file: File): Promise<UploadResponse> => {
  return uploadFile('/uploads/payment-screenshot', file, 'payment');
};

// Upload resume
export const uploadResume = async (file: File): Promise<UploadResponse> => {
  return uploadFile('/uploads/resume', file, 'resume');
};

// Upload salon logo
export const uploadSalonLogo = async (file: File): Promise<UploadResponse> => {
  return uploadFile('/uploads/salon-logo', file, 'salon-logo');
};

// Upload identity proof - CRITICAL FOR REGISTRATION
export const uploadIdentityProof = async (file: File): Promise<UploadResponse> => {
  return uploadFile('/uploads/identity-proof', file, 'identity-proof');
};

// Upload passport photo - CRITICAL FOR REGISTRATION
export const uploadPassportPhoto = async (file: File): Promise<UploadResponse> => {
  return uploadFile('/uploads/passport-photo', file, 'passport-photo');
};

// Upload multiple images
export const uploadMultipleImages = async (
  files: File[],
  category: string
): Promise<MultipleUploadResponse> => {
  try {
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const validation = validateFile(file);
        if (!validation.valid) {
          throw new Error(validation.error || 'File validation failed');
        }

        const url = await uploadFileToBlob(file, category);
        return {
          url,
          originalName: file.name
        };
      })
    );

    return {
      success: true,
      files: uploadedFiles,
      message: `${files.length} files uploaded successfully`
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    throw new Error(errorMessage, { cause: error });
  }
};

// Delete a file from Vercel Blob
export const deleteFile = async (url: string): Promise<{ success: boolean; message: string }> => {
  try {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      return { success: true, message: 'Local file deleted' };
    }

    // Delete from Vercel Blob if it's a blob URL
    const response = await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (response.ok) {
      return { success: true, message: 'File deleted from storage' };
    }
    
    throw new Error('Delete failed');
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

