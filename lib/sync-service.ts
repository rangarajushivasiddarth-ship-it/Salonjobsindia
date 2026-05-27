'use client'

// Centralized sync service for bi-directional updates between salon owner and job seeker
export const SyncService = {
  // Trigger data sync across all tabs and windows
  notifyDataUpdate: (key: string, data?: any) => {
    if (typeof window !== 'undefined') {
      const timestamp = Date.now();
      const syncMessage = { key, data, timestamp };
      localStorage.setItem(`salonjobsindia_sync_${key}`, JSON.stringify(syncMessage));
      window.dispatchEvent(new CustomEvent('salonjobsindia_sync', { detail: syncMessage }));
    }
  },

  // Subscribe to specific data updates
  subscribe: (key: string, callback: (data: any) => void) => {
    if (typeof window === 'undefined') return () => {};

    const handleSync = (event: CustomEvent) => {
      if (event.detail.key === key || key === '*') {
        callback(event.detail.data);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.includes('salonjobsindia_sync_')) {
        try {
          const data = JSON.parse(event.newValue || '{}');
          if (data.key === key || key === '*') {
            callback(data.data);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('salonjobsindia_sync', handleSync as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('salonjobsindia_sync', handleSync as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  },

  // Get all jobs that need approval
  getPendingJobs: () => {
    if (typeof window === 'undefined') return [];
    try {
      const jobs = JSON.parse(localStorage.getItem('salonjobsindia_jobs') || '[]');
      return jobs.filter((j: any) => j.status === 'pending_approval' || j.status === 'payment_pending');
    } catch {
      return [];
    }
  },

  // Get job applications for a specific salon
  getApplicationsForSalon: (salonId: string) => {
    if (typeof window === 'undefined') return [];
    try {
      const applications = JSON.parse(localStorage.getItem('salonjobsindia_applications') || '[]');
      return applications.filter((app: any) => app.salonId === salonId);
    } catch {
      return [];
    }
  },

  // Get new jobs for job seeker
  getNewJobsForJobSeeker: (lastFetchTime: number) => {
    if (typeof window === 'undefined') return [];
    try {
      const jobs = JSON.parse(localStorage.getItem('salonjobsindia_jobs') || '[]');
      return jobs.filter((j: any) => 
        j.status === 'live' && 
        new Date(j.createdAt).getTime() > lastFetchTime
      );
    } catch {
      return [];
    }
  },

  // Sync job applications from job seeker to salon owner
  syncApplicationToSalon: (application: any) => {
    if (typeof window === 'undefined') return;
    SyncService.notifyDataUpdate('application_created', application);
  },

  // Sync job posting from salon owner to job seekers
  syncJobPosting: (job: any) => {
    if (typeof window === 'undefined') return;
    SyncService.notifyDataUpdate('job_posted', job);
  },

  // Sync subscription approval from admin to user
  syncSubscriptionApproval: (subscription: any) => {
    if (typeof window === 'undefined') return;
    SyncService.notifyDataUpdate('subscription_approved', subscription);
  },
};
