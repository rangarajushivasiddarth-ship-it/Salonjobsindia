// Auth API services
import api, { setTokens, clearTokens } from './client';

export interface User {
  id: string;
  phone: string;
  name: string;
  role: 'professional' | 'owner' | 'admin';
  avatar?: string;
  email?: string;
  isVerified: boolean;
  salonName?: string;
  bio?: string;
  skills?: string[];
  experience?: number;
  subscriptionStatus?: 'none' | 'pending' | 'active' | 'expired';
}

export interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  isNewUser: boolean;
}

export interface VerifyOTPResponse {
  success: boolean;
  requiresRegistration: boolean;
  phone?: string;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
}

// Send OTP for login/registration
export const sendOTP = async (phone: string): Promise<OTPResponse> => {
  return api.post<OTPResponse>('/auth/send-otp', { phone }, { auth: false });
};

// Verify OTP
export const verifyOTP = async (phone: string, otp: string): Promise<VerifyOTPResponse> => {
  const response = await api.post<VerifyOTPResponse>('/auth/verify-otp', { phone, otp }, { auth: false });
  
  if (response.accessToken && response.refreshToken) {
    setTokens(response.accessToken, response.refreshToken);
  }
  
  return response;
};

// Complete registration after OTP verification
export const register = async (data: {
  phone: string;
  name: string;
  role: 'professional' | 'owner';
  salonName?: string;
  salonAddress?: string;
}): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', data, { auth: false });
  
  if (response.accessToken && response.refreshToken) {
    setTokens(response.accessToken, response.refreshToken);
  }
  
  return response;
};

// Get current user
export const getCurrentUser = async (): Promise<{ success: boolean; user: User }> => {
  return api.get('/auth/me');
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } finally {
    clearTokens();
  }
};

// Admin login
export const adminLogin = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/admin/login', { email, password }, { auth: false });
  
  if (response.accessToken && response.refreshToken) {
    setTokens(response.accessToken, response.refreshToken);
  }
  
  return response;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('fitonze_access_token');
};

// Email/password login
export const login = async (email: string, password: string): Promise<{ success: boolean; data?: { user: User; token: string }; error?: string }> => {
  try {
    const response = await api.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', { email, password }, { auth: false });
    
    if (response.accessToken && response.refreshToken) {
      setTokens(response.accessToken, response.refreshToken);
    }
    
    return { 
      success: true, 
      data: { 
        user: response.user, 
        token: response.accessToken 
      } 
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
  }
};

// Email/password registration
export const registerWithEmail = async (data: {
  name: string;
  email: string;
  password: string;
  phone: string;
}): Promise<{ success: boolean; data?: { user: User; token: string }; error?: string }> => {
  try {
    const response = await api.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', data, { auth: false });
    
    if (response.accessToken && response.refreshToken) {
      setTokens(response.accessToken, response.refreshToken);
    }
    
    return { 
      success: true, 
      data: { 
        user: response.user, 
        token: response.accessToken 
      } 
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Registration failed' };
  }
};

// Grouped export for easy importing
export const authApi = {
  sendOTP,
  verifyOTP,
  register: registerWithEmail,
  getCurrentUser,
  logout,
  adminLogin,
  isAuthenticated,
  login,
};
