// Users API services
import api from './client';

export interface PortfolioItem {
  id: string;
  url: string;
  caption?: string;
  createdAt: string;
}

export interface WorkExperience {
  id: string;
  salonName: string;
  role: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  imageUrl?: string;
}

export interface UserLocation {
  type: 'Point';
  coordinates: [number, number];
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface UserProfile {
  _id: string;
  phone: string;
  email?: string;
  role: 'professional' | 'owner' | 'admin';
  isVerified: boolean;
  isActive: boolean;
  name: string;
  avatar?: string;
  bio?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  skills?: string[];
  experience?: number;
  portfolio?: PortfolioItem[];
  workHistory?: WorkExperience[];
  certifications?: Certification[];
  location?: UserLocation;
  salonName?: string;
  salonAddress?: string;
  salonDescription?: string;
  subscriptionId?: string;
  subscriptionStatus?: 'none' | 'pending' | 'active' | 'expired';
  createdAt: string;
  updatedAt: string;
}

// Get current user's profile
export const getProfile = async (): Promise<{ success: boolean; user: UserProfile }> => {
  return api.get('/users/profile');
};

// Update profile
export const updateProfile = async (data: Partial<UserProfile>): Promise<{ success: boolean; message: string; user: UserProfile }> => {
  return api.put('/users/profile', data);
};

// Update location
export const updateLocation = async (location: {
  coordinates: [number, number];
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}): Promise<{ success: boolean; message: string; location: UserLocation }> => {
  return api.put('/users/location', location);
};

// Portfolio management
export const addPortfolioItem = async (url: string, caption?: string): Promise<{ success: boolean; message: string; portfolio: PortfolioItem[] }> => {
  return api.post('/users/portfolio', { url, caption });
};

export const removePortfolioItem = async (itemId: string): Promise<{ success: boolean; message: string; portfolio: PortfolioItem[] }> => {
  return api.delete(`/users/portfolio/${itemId}`);
};

// Work history management
export const addWorkHistory = async (data: Omit<WorkExperience, 'id'>): Promise<{ success: boolean; message: string; workHistory: WorkExperience[] }> => {
  return api.post('/users/work-history', data);
};

export const removeWorkHistory = async (itemId: string): Promise<{ success: boolean; message: string; workHistory: WorkExperience[] }> => {
  return api.delete(`/users/work-history/${itemId}`);
};

// Certification management
export const addCertification = async (data: Omit<Certification, 'id'>): Promise<{ success: boolean; message: string; certifications: Certification[] }> => {
  return api.post('/users/certifications', data);
};

export const removeCertification = async (itemId: string): Promise<{ success: boolean; message: string; certifications: Certification[] }> => {
  return api.delete(`/users/certifications/${itemId}`);
};

// Get public user profile
export const getPublicProfile = async (id: string): Promise<{ success: boolean; user: Partial<UserProfile> }> => {
  return api.get(`/users/${id}`, { auth: false });
};

// Admin: Get all users
export const getAllUsers = async (params: {
  role?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} = {}): Promise<{
  success: boolean;
  users: UserProfile[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  return api.get(`/users?${searchParams.toString()}`);
};

// Admin: Toggle user status
export const toggleUserStatus = async (id: string): Promise<{ success: boolean; message: string; user: UserProfile }> => {
  return api.patch(`/users/${id}/status`, { isActive: true });
};
