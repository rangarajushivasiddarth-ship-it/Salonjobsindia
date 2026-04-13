'use client'

import useSWR from 'swr'
import { jobsApi } from '@/lib/api'
import type { Job } from '@/lib/types'

// =============================================================================
// REAL-TIME JOBS HOOK
// =============================================================================
// This hook connects to the backend API and provides real-time job data.
// It automatically refreshes every 10 seconds to keep data in sync.
// Any changes made by salon owners or admins will be reflected automatically.
// =============================================================================

interface UseRealtimeJobsOptions {
  latitude?: number
  longitude?: number
  radius?: number // in km
  skills?: string[]
  jobType?: 'full_time' | 'part_time' | 'contract' | 'freelance'
  salaryMin?: number
  salaryMax?: number
  enabled?: boolean
  refreshInterval?: number // in ms
}

interface UseRealtimeJobsReturn {
  jobs: Job[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  mutate: () => void
  totalCount: number
  hasMore: boolean
}

// Fetcher function for SWR
const jobsFetcher = async (key: string) => {
  const params = JSON.parse(key.split('::')[1] || '{}')
  const response = await jobsApi.getNearbyJobs(params)
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch jobs')
  }
  
  return response.data
}

export function useRealtimeJobs(options: UseRealtimeJobsOptions = {}): UseRealtimeJobsReturn {
  const {
    latitude,
    longitude,
    radius = 25,
    skills,
    jobType,
    salaryMin,
    salaryMax,
    enabled = true,
    refreshInterval = 10000, // 10 seconds default
  } = options

  // Build cache key
  const cacheKey = enabled
    ? `jobs::${JSON.stringify({
        latitude,
        longitude,
        radius,
        skills,
        jobType,
        salaryMin,
        salaryMax,
      })}`
    : null

  const { data, error, isLoading, mutate } = useSWR(
    cacheKey,
    jobsFetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  )

  return {
    jobs: data?.jobs || [],
    isLoading,
    isError: !!error,
    error: error || null,
    mutate,
    totalCount: data?.pagination?.total || 0,
    hasMore: data?.pagination?.hasMore || false,
  }
}

// =============================================================================
// SINGLE JOB HOOK
// =============================================================================

interface UseRealtimeJobReturn {
  job: Job | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  mutate: () => void
}

const singleJobFetcher = async (key: string) => {
  const jobId = key.split('::')[1]
  const response = await jobsApi.getJobById(jobId)
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch job')
  }
  
  return response.data
}

export function useRealtimeJob(jobId: string | null): UseRealtimeJobReturn {
  const { data, error, isLoading, mutate } = useSWR(
    jobId ? `job::${jobId}` : null,
    singleJobFetcher,
    {
      refreshInterval: 30000, // 30 seconds for single job
      revalidateOnFocus: true,
    }
  )

  return {
    job: data || null,
    isLoading,
    isError: !!error,
    error: error || null,
    mutate,
  }
}

// =============================================================================
// SAVED JOBS HOOK
// =============================================================================

export function useSavedJobs() {
  const { data, error, isLoading, mutate } = useSWR(
    'saved-jobs',
    async () => {
      const response = await jobsApi.getSavedJobs()
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch saved jobs')
      }
      return response.data
    },
    {
      refreshInterval: 15000,
      revalidateOnFocus: true,
    }
  )

  const saveJob = async (jobId: string) => {
    try {
      await jobsApi.saveJob(jobId)
      mutate()
    } catch (error) {
      console.error('Failed to save job:', error)
    }
  }

  const unsaveJob = async (jobId: string) => {
    try {
      await jobsApi.unsaveJob(jobId)
      mutate()
    } catch (error) {
      console.error('Failed to unsave job:', error)
    }
  }

  return {
    savedJobs: data?.jobs || [],
    isLoading,
    isError: !!error,
    error: error || null,
    mutate,
    saveJob,
    unsaveJob,
  }
}

// =============================================================================
// OWNER JOBS HOOK (For salon owners to manage their job postings)
// =============================================================================

export function useOwnerJobs() {
  const { data, error, isLoading, mutate } = useSWR(
    'owner-jobs',
    async () => {
      const response = await jobsApi.getMyJobs()
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch your jobs')
      }
      return response.data
    },
    {
      refreshInterval: 15000,
      revalidateOnFocus: true,
    }
  )

  const createJob = async (jobData: Parameters<typeof jobsApi.createJob>[0]) => {
    try {
      const response = await jobsApi.createJob(jobData)
      if (response.success) {
        mutate()
        return { success: true, job: response.data }
      }
      return { success: false, error: response.error }
    } catch (error) {
      console.error('Failed to create job:', error)
      return { success: false, error: 'Failed to create job' }
    }
  }

  const updateJob = async (jobId: string, updates: Parameters<typeof jobsApi.updateJob>[1]) => {
    try {
      const response = await jobsApi.updateJob(jobId, updates)
      if (response.success) {
        mutate()
        return { success: true, job: response.data }
      }
      return { success: false, error: response.error }
    } catch (error) {
      console.error('Failed to update job:', error)
      return { success: false, error: 'Failed to update job' }
    }
  }

  const deleteJob = async (jobId: string) => {
    try {
      const response = await jobsApi.deleteJob(jobId)
      if (response.success) {
        mutate()
        return { success: true }
      }
      return { success: false, error: response.error }
    } catch (error) {
      console.error('Failed to delete job:', error)
      return { success: false, error: 'Failed to delete job' }
    }
  }

  return {
    jobs: data?.jobs || [],
    isLoading,
    isError: !!error,
    error: error || null,
    mutate,
    createJob,
    updateJob,
    deleteJob,
  }
}
