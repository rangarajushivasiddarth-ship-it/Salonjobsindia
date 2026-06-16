'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/use-translation'
import { useLanguage } from '@/lib/language-context'
import { ArrowLeft, Bell, Briefcase, Crown, MessageCircle, CheckCircle, Clock, Trash2, Settings, CreditCard, X, Check } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'

interface Notification {
  id: string
  type: 'job' | 'message' | 'subscription' | 'system' | 'payment_approved' | 'payment_rejected' | 'payment_submitted'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  actionUrl?: string
  createdAt?: Date
}

export function NotificationsScreen() {
  const { goToStep, user } = useApp()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  
  // Load notifications from localStorage (for payment notifications)
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`fitonze_notifications_${user.id}`)
      if (stored) {
        const storedNotifications = JSON.parse(stored).map((n: Notification & { createdAt?: string }) => ({
          ...n,
          timestamp: new Date(n.createdAt || Date.now()),
        }))
        setNotifications(storedNotifications)
      }
      
      // Also check the data-store notifications
      const dataStoreNotifications = localStorage.getItem('fitonze_notifications')
      if (dataStoreNotifications) {
        try {
          const allNotifications = JSON.parse(dataStoreNotifications)
          const userNotifications = allNotifications
            .filter((n: { userId: string }) => n.userId === user.id)
            .map((n: Notification & { createdAt?: string }) => ({
              ...n,
              timestamp: new Date(n.createdAt || Date.now()),
            }))
          if (userNotifications.length > 0) {
            setNotifications(prev => {
              // Merge and dedupe by id
              const existingIds = new Set(prev.map(p => p.id))
              const newOnes = userNotifications.filter((n: Notification) => !existingIds.has(n.id))
              return [...newOnes, ...prev]
            })
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [user?.id])
  
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications
  
  const unreadCount = notifications.filter(n => !n.isRead).length
  
  const formatTime = (date: Date) => {
    const now = Date.now()
    const diff = now - date.getTime()
    
    if (diff < 60 * 60 * 1000) {
      const mins = Math.floor(diff / (60 * 1000))
      return `${mins}m ago`
    } else if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000))
      return `${hours}h ago`
    } else {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000))
      return `${days}d ago`
    }
  }
  
const getIcon = (type: Notification['type']) => {
  switch (type) {
  case 'job': return Briefcase
  case 'message': return MessageCircle
  case 'subscription': return Crown
  case 'payment_approved': return Check
  case 'payment_rejected': return X
  case 'payment_submitted': return CreditCard
  default: return Bell
  }
  }
  
  const getIconColor = (type: Notification['type']) => {
  switch (type) {
  case 'job': return 'bg-primary/20 text-primary'
  case 'message': return 'bg-accent/20 text-accent'
  case 'subscription': return 'bg-amber-500/20 text-amber-500'
  case 'payment_approved': return 'bg-green-500/20 text-green-400'
  case 'payment_rejected': return 'bg-red-500/20 text-red-400'
  case 'payment_submitted': return 'bg-blue-500/20 text-blue-400'
  default: return 'bg-secondary text-muted-foreground'
  }
  }
  
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
  }
  
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }
  
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }
  
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden pb-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      
      {/* Header */}
      <header className="relative z-10 p-4 glass">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => goToStep('results')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              filter === 'all' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all flex items-center gap-2 ${
              filter === 'unread' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                filter === 'unread' ? 'bg-primary-foreground/20' : 'bg-destructive text-destructive-foreground'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="ml-auto px-3 py-2 text-xs font-medium text-primary hover:text-primary/80"
            >
              Mark all read
            </button>
          )}
        </div>
      </header>
      
      {/* Notifications List */}
      <div className="relative z-10 flex-1 p-4 overflow-y-auto">
        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification, index) => {
              const Icon = getIcon(notification.type)
              return (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`p-4 glass-card rounded-xl transition-all duration-300 hover:scale-[1.01] animate-slide-up cursor-pointer ${
                    !notification.isRead ? 'border-l-4 border-primary' : ''
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getIconColor(notification.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-semibold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border/30">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {filter === 'unread' ? 'All caught up!' : 'No notifications'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {filter === 'unread' 
                ? 'You have no unread notifications' 
                : 'Notifications will appear here'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
