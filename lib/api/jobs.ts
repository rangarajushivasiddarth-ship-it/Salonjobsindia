// Jobs API services
import api from './client';

export interface Location {
  type: 'Point';
  coordinates: [number, number];
  address: string;
  city: string;
  state?: string;
  pincode?: string;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface Job {
  _id: string;
  ownerId: string | { _id: string; name: string; avatar?: string; salonName?: string };
  title: string;
  description: string;
  salonName: string;
  salonLogo?: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'freelance';
  skills: string[];
  experienceRequired: number;
  salary: SalaryRange;
  location: Location;
  requirements: string[];
  benefits: string[];
  status: 'draft' | 'active' | 'paused' | 'closed' | 'expired';
  isUrgent: boolean;
  isFeatured: boolean;
  viewCount: number;
  applicationCount: number;
  postedAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  distance?: number;
  distanceKm?: number;
}

export interface JobsResponse {
  success: boolean;
  jobs: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface JobFilters {
  search?: string;
  skills?: string;
  jobType?: string;
  city?: string;
  minSalary?: number;
  maxSalary?: number;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sort?: 'recent' | 'distance' | 'salary-high' | 'salary-low';
}

// Get jobs with filters
export const getJobs = async (filters: JobFilters = {}): Promise<JobsResponse> => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  
  const query = params.toString();
  return api.get(`/jobs${query ? `?${query}` : ''}`, { auth: false });
};

// Get nearby jobs
export const getNearbyJobs = async (lat: number, lng: number, radius = 25, limit = 10): Promise<{ success: boolean; jobs: Job[] }> => {
  return api.get(`/jobs/nearby?lat=${lat}&lng=${lng}&radius=${radius}&limit=${limit}`, { auth: false });
};

// Get featured jobs
export const getFeaturedJobs = async (): Promise<{ success: boolean; featuredJobs: Job[]; urgentJobs: Job[] }> => {
  return api.get('/jobs/featured', { auth: false });
};

// Get single job
export const getJob = async (id: string): Promise<{ success: boolean; job: Job; hasApplied: boolean }> => {
  return api.get(`/jobs/${id}`);
};

// Create a new job (owner)
export const createJob = async (jobData: Partial<Job>): Promise<{ success: boolean; message: string; job: Job }> => {
  return api.post('/jobs', jobData);
};

// Get owner's jobs
export const getMyJobs = async (status?: string, page = 1, limit = 20): Promise<JobsResponse> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== 'all') params.append('status', status);
  return api.get(`/jobs/owner/my-jobs?${params.toString()}`);
};

// Update job
export const updateJob = async (id: string, data: Partial<Job>): Promise<{ success: boolean; message: string; job: Job }> => {
  return api.put(`/jobs/${id}`, data);
};

// Update job status
export const updateJobStatus = async (id: string, status: string): Promise<{ success: boolean; message: string; job: Job }> => {
  return api.patch(`/jobs/${id}/status`, { status });
};

// Delete job
export const deleteJob = async (id: string): Promise<{ success: boolean; message: string }> => {
  return api.delete(`/jobs/${id}`);
};
