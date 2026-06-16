// Uploads API services - Using Hostinger SFTP storage for persistent file storage

export interface UploadResponse {
  success: boolean
  url: string
  path: string
  message: string
  error?: string
}

// Upload file to Hostinger SFTP via Vercel API route
const uploadFileToHostinger = async (
  file: File,
  category: string,
  userId: string
): Promise<string> => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)
    formData.append('userId', userId)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    const data: UploadResponse = await response.json()
    console.log('[v0] File uploaded to Hostinger:', data.url)
    return data.url
  } catch (error) {
    console.error('[v0] Upload error:', error)
    throw error
  }
}

// Generic upload function
const uploadFile = async (
  file: File,
  category: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!file) {
    throw new Error('No file selected')
  }

  if (onProgress) onProgress(25)

  try {
    const url = await uploadFileToHostinger(file, category, userId)
    if (onProgress) onProgress(100)
    return url
  } catch (error) {
    console.error('[v0] Upload failed:', error)
    throw error
  }
}

// Upload avatar/profile photo
export const uploadAvatar = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return uploadFile(file, 'profile-photo', userId, onProgress)
}

// Upload resume
export const uploadResume = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return uploadFile(file, 'resume', userId, onProgress)
}

// Upload payment screenshot (for subscriptions/job posting)
export const uploadPaymentScreenshot = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return uploadFile(file, 'payment-screenshot', userId, onProgress)
}

// Upload verification document
export const uploadVerificationDocument = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return uploadFile(file, 'verification-document', userId, onProgress)
}

// Upload banner/logo
export const uploadBannerLogo = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return uploadFile(file, 'banner-logo', userId, onProgress)
}

// Upload salon gallery image
export const uploadSalonGalleryImage = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return uploadFile(file, 'salon-gallery', userId, onProgress)
}

// Upload identity/passport photo
export const uploadIdentityProof = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return uploadFile(file, 'verification-document', userId, onProgress)
}

// Upload passport photo (alias for identity proof)
export const uploadPassportPhoto = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return uploadFile(file, 'verification-document', userId, onProgress)
}

// Generic upload with category
export const uploadFileWithCategory = async (
  file: File,
  category: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return uploadFile(file, category, userId, onProgress)
}

// Delete file from Hostinger
export const deleteFile = async (
  filePath: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Delete failed')
    }

    const data = await response.json()
    console.log('[v0] File deleted from Hostinger:', filePath)
    return { success: true, message: 'File deleted' }
  } catch (error) {
    console.error('[v0] Delete error:', error)
    throw error
  }
}

// Get file download URL (for resume downloads)
export const getFileDownloadUrl = (publicUrl: string): string => {
  // For Hostinger, the public URL is already the download URL
  return publicUrl
}

export default {
  uploadAvatar,
  uploadResume,
  uploadPaymentScreenshot,
  uploadVerificationDocument,
  uploadBannerLogo,
  uploadSalonGalleryImage,
  uploadFileWithCategory,
  deleteFile,
  getFileDownloadUrl,
}
