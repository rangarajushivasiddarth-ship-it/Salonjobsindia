// Subscriptions API services
import api from './client';

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'free' | 'basic' | 'premium' | 'enterprise';
  price: number;
  currency: string;
  duration: number;
  description: string;
  features: {
    maxJobPosts: number;
    maxApplicationsPerJob: number;
    featuredListings: number;
    prioritySupport: boolean;
    analyticsAccess: boolean;
    resumeBuilder: boolean;
    unlimitedApplications: boolean;
  };
  forRole: 'professional' | 'owner' | 'both';
  popular?: boolean;
}

export interface Subscription {
  _id: string;
  userId: string;
  userRole: 'professional' | 'owner';
  planId: string;
  planName: string;
  planType: 'free' | 'basic' | 'premium' | 'enterprise';
  amount: number;
  currency: string;
  duration: number;
  features: SubscriptionPlan['features'];
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'rejected';
  paymentProof?: {
    screenshotUrl: string;
    uploadedAt: string;
    transactionId?: string;
    paymentMethod: 'upi' | 'bank_transfer' | 'cash' | 'other';
    note?: string;
  };
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  rejectionReason?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  isCurrentlyActive?: boolean;
}

// Get available plans
export const getPlans = async (role?: 'professional' | 'owner'): Promise<{
  success: boolean;
  plans?: SubscriptionPlan[];
  professionalPlans?: SubscriptionPlan[];
  ownerPlans?: SubscriptionPlan[];
}> => {
  const query = role ? `?role=${role}` : '';
  return api.get(`/subscriptions/plans${query}`, { auth: false });
};

// Get single plan
export const getPlan = async (planId: string): Promise<{ success: boolean; plan: SubscriptionPlan }> => {
  return api.get(`/subscriptions/plans/${planId}`, { auth: false });
};

// Get my subscription
export const getMySubscription = async (): Promise<{
  success: boolean;
  subscriptionStatus: 'none' | 'pending' | 'active' | 'expired';
  subscription: Subscription | null;
}> => {
  return api.get('/subscriptions/my-subscription');
};

// Subscribe to a plan
export const subscribe = async (data: {
  planId: string;
  paymentMethod: 'upi' | 'bank_transfer' | 'cash' | 'other';
  screenshotUrl: string;
  transactionId?: string;
  note?: string;
}): Promise<{ success: boolean; message: string; subscription: Subscription }> => {
  return api.post('/subscriptions/subscribe', data);
};

// Get subscription history
export const getSubscriptionHistory = async (): Promise<{ success: boolean; subscriptions: Subscription[] }> => {
  return api.get('/subscriptions/history');
};

// Admin: Get pending subscriptions
export const getPendingSubscriptions = async (page = 1, limit = 20): Promise<{
  success: boolean;
  subscriptions: Array<Subscription & { userId: { _id: string; name: string; phone: string; email?: string; role: string; avatar?: string } }>;
  pagination: { page: number; limit: number; total: number; pages: number };
}> => {
  return api.get(`/subscriptions/pending?page=${page}&limit=${limit}`);
};

// Admin: Approve subscription
export const approveSubscription = async (id: string, note?: string): Promise<{ success: boolean; message: string; subscription: Subscription }> => {
  return api.put(`/subscriptions/${id}/approve`, { note });
};

// Admin: Reject subscription
export const rejectSubscription = async (id: string, reason: string): Promise<{ success: boolean; message: string; subscription: Subscription }> => {
  return api.put(`/subscriptions/${id}/reject`, { reason });
};

// Admin: Get all subscriptions
export const getAllSubscriptions = async (status?: string, page = 1, limit = 20): Promise<{
  success: boolean;
  subscriptions: Array<Subscription & { userId: { _id: string; name: string; phone: string; email?: string; role: string; avatar?: string } }>;
  pagination: { page: number; limit: number; total: number; pages: number };
}> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== 'all') params.append('status', status);
  return api.get(`/subscriptions/all?${params.toString()}`);
};

// Submit payment with screenshot
export const submitPayment = async (planId: string, screenshotFile: File): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  subscription?: Subscription;
}> => {
  const formData = new FormData();
  formData.append('planId', planId);
  formData.append('screenshot', screenshotFile);
  return api.post('/subscriptions/submit-payment', formData, { formData: true });
};

// Unified subscriptionsApi export for hooks
export const subscriptionsApi = {
  getPlans,
  getPlan,
  getMySubscription,
  subscribe,
  getSubscriptionHistory,
  getPendingSubscriptions,
  approveSubscription,
  rejectSubscription,
  getAllSubscriptions,
  submitPayment,
};
