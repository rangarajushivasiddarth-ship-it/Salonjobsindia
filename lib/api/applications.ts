// Applications API services
import api from './client';
import type { Job } from './jobs';

export interface Application {
  _id: string;
  jobId: string | Job;
  professionalId: string | {
    _id: string;
    name: string;
    avatar?: string;
    phone: string;
    skills?: string[];
    experience?: number;
    portfolio?: Array<{ id: string; url: string; caption?: string }>;
    location?: { city?: string };
  };
  ownerId: string;
  coverLetter?: string;
  resumeUrl?: string;
  expectedSalary?: number;
  availableFrom?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected' | 'withdrawn';
  ownerNote?: string;
  interviewDate?: string;
  interviewLocation?: string;
  isViewed: boolean;
  viewedAt?: string;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationsResponse {
  success: boolean;
  applications: Application[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Apply to a job
export const applyToJob = async (data: {
  jobId: string;
  coverLetter?: string;
  resumeUrl?: string;
  expectedSalary?: number;
  availableFrom?: string;
}): Promise<{ success: boolean; message: string; application: Application }> => {
  return api.post('/applications', data);
};

// Get my applications (professional)
export const getMyApplications = async (
  status?: string,
  page = 1,
  limit = 20
): Promise<ApplicationsResponse> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== 'all') params.append('status', status);
  return api.get(`/applications/my-applications?${params.toString()}`);
};

// Withdraw an application
export const withdrawApplication = async (id: string): Promise<{ success: boolean; message: string; application: Application }> => {
  return api.put(`/applications/${id}/withdraw`);
};

// Get applications for a job (owner)
export const getJobApplications = async (
  jobId: string,
  status?: string,
  page = 1,
  limit = 20
): Promise<ApplicationsResponse & { job: { id: string; title: string } }> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== 'all') params.append('status', status);
  return api.get(`/applications/job/${jobId}?${params.toString()}`);
};

// Get all applications for owner
export const getAllOwnerApplications = async (
  status?: string,
  page = 1,
  limit = 20
): Promise<ApplicationsResponse> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== 'all') params.append('status', status);
  return api.get(`/applications/owner/all?${params.toString()}`);
};

// Update application status (owner)
export const updateApplicationStatus = async (
  id: string,
  data: {
    status: 'reviewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected';
    note?: string;
    interviewDate?: string;
    interviewLocation?: string;
  }
): Promise<{ success: boolean; message: string; application: Application }> => {
  return api.put(`/applications/${id}/status`, data);
};

// Get single application details
export const getApplication = async (id: string): Promise<{ success: boolean; application: Application }> => {
  return api.get(`/applications/${id}`);
};

// Apply to a job (alias)
export const apply = async (jobId: string, coverLetter?: string): Promise<{ success: boolean; message?: string; error?: string; application?: Application }> => {
  return api.post('/applications', { jobId, coverLetter });
};

// Withdraw application (alias)
export const withdraw = async (applicationId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  return api.put(`/applications/${applicationId}/withdraw`);
};

// Update status (alias)
export const updateStatus = async (applicationId: string, status: 'shortlisted' | 'rejected' | 'hired'): Promise<{ success: boolean; message?: string; error?: string }> => {
  return api.put(`/applications/${applicationId}/status`, { status });
};

// Get owner applications (alias)
export const getOwnerApplications = async (): Promise<{ success: boolean; applications?: Application[]; error?: string }> => {
  return api.get('/applications/owner/all');
};

// Unified applicationsApi export for hooks
export const applicationsApi = {
  applyToJob,
  apply,
  getMyApplications,
  withdrawApplication,
  withdraw,
  getJobApplications,
  getAllOwnerApplications,
  getOwnerApplications,
  updateApplicationStatus,
  updateStatus,
  getApplication,
};
