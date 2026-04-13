// Uploads API services
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

// Generic upload function
const uploadFile = async (
  endpoint: string,
  file: File,
  fieldName: string
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append(fieldName, file);

  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
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
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('images', file);
  });
  formData.append('category', category);

  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}/uploads/multiple`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
};

// Delete a file
export const deleteFile = async (url: string): Promise<{ success: boolean; message: string }> => {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}/uploads`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Delete failed');
  }

  return response.json();
};

// Helper to validate file before upload
export const validateFile = (
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } => {
  const { maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } = options;

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }

  return { valid: true };
};
