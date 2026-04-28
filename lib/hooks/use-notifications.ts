'use client'

import useSWR from 'swr'
import api from '@/lib/api/client'

// =============================================================================
// REAL-TIME NOTIFICATIONS HOOK
// =============================================================================
// Keeps users updated on application status, new jobs, subscription approvals, etc.
// =============================================================================

export interface Notification {
  id: string
  type: 'application_update' | 'new_job' | 'subscription_approved' | 'subscription_rejected' | 'job_expired' | 'message' | 'system'
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  createdAt: Date
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  isError: boolean
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  mutate: () => void
}

export function useNotifications(): UseNotificationsReturn {
  const { data, error, isLoading, mutate } = useSWR(
    'notifications',
    async () => {
      const response = await api.get<{ notifications: Notification[] }>('/users/notifications')
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch notifications')
      }
      return response.data
    },
    {
      refreshInterval: 10000, // Check every 10 seconds
      revalidateOnFocus: true,
    }
  )

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/users/notifications/${notificationId}/read`, {})
      mutate()
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.put('/users/notifications/read-all', {})
      mutate()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/users/notifications/${notificationId}`)
      mutate()
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const notifications = data?.notifications || []
  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    unreadCount,
    isLoading,
    isError: !!error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    mutate,
  }
}
