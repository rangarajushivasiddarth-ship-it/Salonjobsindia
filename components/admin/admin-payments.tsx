'use client'

import { useState } from 'react'
import { Check, X, Eye, Image as ImageIcon, Clock, User, AlertCircle, Crown, RefreshCw, Wifi, WifiOff, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAdmin } from '@/lib/admin-context'
import { AdminSidebar } from './admin-sidebar'
import { JOB_SEEKER_PLANS } from '@/lib/data-store'
import { useAdminSync } from '@/lib/hooks/use-realtime-sync'

export function AdminPayments() {
  const { pendingPayments: localPendingPayments, users, approvePayment: localApprovePayment, rejectPayment: localRejectPayment } = useAdmin()
  
  // Real-time sync from cloud storage (cross-device)
  const { 
    pendingSubscriptions, 
    pendingJobPayments,
    totalPending,
    lastSync,
    isLoading,
    error,
    refresh,
    approveSubscription,
    rejectSubscription,
    approveJobPayment,
    rejectJobPayment,
  } = useAdminSync(2000) // Poll every 2 seconds
  
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: 'subscription' | 'job-payment' | 'local'; action: 'approve' | 'reject' } | null>(null)
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'jobs' | 'local'>('subscriptions')

  const formatTime = (date: Date) => {
    const hours = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60))
    if (hours < 1) return 'Just now'
    if (hours === 1) return '1 hour ago'
    if (hours < 24) return `${hours} hours ago`
    return `${Math.floor(hours / 24)} days ago`
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return
    
    if (confirmAction.type === 'subscription') {
      if (confirmAction.action === 'approve') {
        await approveSubscription(confirmAction.id)
      } else {
        await rejectSubscription(confirmAction.id)
      }
    } else if (confirmAction.type === 'job-payment') {
      if (confirmAction.action === 'approve') {
        await approveJobPayment(confirmAction.id)
      } else {
        await rejectJobPayment(confirmAction.id)
      }
    } else {
      // Local fallback
      if (confirmAction.action === 'approve') {
        localApprovePayment(confirmAction.id)
      } else {
        localRejectPayment(confirmAction.id)
      }
    }
    
    setConfirmAction(null)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">Payment Approvals</h1>
              <p className="text-muted-foreground">Review and approve payment screenshots</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Sync Status */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                error ? 'bg-destructive/20 text-destructive' : 'bg-green-500/20 text-green-400'
              }`}>
                {error ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                {error ? 'Offline' : 'Live Sync'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh()}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          {lastSync > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Last synced: {new Date(lastSync).toLocaleTimeString()}
            </p>
          )}
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
              activeTab === 'subscriptions'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            Subscriptions
            {pendingSubscriptions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
                {pendingSubscriptions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
              activeTab === 'jobs'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            Job Postings
            {pendingJobPayments.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
                {pendingJobPayments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
              activeTab === 'local'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            Local Queue
            {localPendingPayments.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
                {localPendingPayments.length}
              </span>
            )}
          </button>
        </div>
        
        {/* Pending Count */}
        <div className="mb-6 p-4 glass-card rounded-xl flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalPending + localPendingPayments.length}</p>
            <p className="text-sm text-muted-foreground">Total Pending Approvals (Cloud: {totalPending}, Local: {localPendingPayments.length})</p>
          </div>
        </div>
        
        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {pendingSubscriptions.map((payment, index) => (
            <div
              key={payment.id}
              className="p-6 glass-card rounded-2xl animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                    <Crown className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{payment.userName || 'Unknown User'}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{payment.userPhone || 'No phone'}</span>
                      <span>•</span>
                      <span className="capitalize">{payment.userRole?.replace('_', ' ') || 'Job Seeker'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm mt-1">
                      <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs font-medium">
                        {payment.planName || 'Premium'} - Rs.{payment.planPrice || 199}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Submitted {formatTime(new Date(payment.createdAt))}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {payment.screenshotUrl && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPayment(payment.id)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Screenshot
                    </Button>
                  )}
                  <Button
                    onClick={() => setConfirmAction({ id: payment.id, type: 'subscription', action: 'approve' })}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setConfirmAction({ id: payment.id, type: 'subscription', action: 'reject' })}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {pendingSubscriptions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center glass-card rounded-2xl">
              <Check className="w-16 h-16 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No pending subscription payments</p>
            </div>
          )}
        </div>
        )}
        
        {/* Job Payments Tab */}
        {activeTab === 'jobs' && (
        <div className="space-y-4">
          {pendingJobPayments.map((payment, index) => (
            <div
              key={payment.id}
              className="p-6 glass-card rounded-2xl animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center">
                    <Briefcase className="w-7 h-7 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{payment.salonName || 'Unknown Business'}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{payment.ownerName}</span>
                      <span>•</span>
                      <span>{payment.ownerPhone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm mt-1">
                      <span className="px-2 py-0.5 bg-accent/20 text-accent rounded-full text-xs font-medium">
                        Job: {payment.jobTitle} - Rs.{payment.planPrice}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Submitted {formatTime(new Date(payment.createdAt))}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {payment.screenshotUrl && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPayment(payment.id)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Screenshot
                    </Button>
                  )}
                  <Button
                    onClick={() => setConfirmAction({ id: payment.id, type: 'job-payment', action: 'approve' })}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setConfirmAction({ id: payment.id, type: 'job-payment', action: 'reject' })}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {pendingJobPayments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center glass-card rounded-2xl">
              <Check className="w-16 h-16 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No pending job posting payments</p>
            </div>
          )}
        </div>
        )}
        
        {/* Local Queue Tab (fallback) */}
        {activeTab === 'local' && (
        <div className="space-y-4">
          {localPendingPayments.map((payment, index) => {
            const user = users.find(u => u.id === payment.userId)
            
            return (
              <div
                key={payment.id}
                className="p-6 glass-card rounded-2xl animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{(payment as unknown as Record<string, unknown>).userName as string || user?.email || 'Unknown User'}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{(payment as unknown as Record<string, unknown>).userPhone as string || user?.phone || 'No phone'}</span>
                        <span>•</span>
                        <span className="capitalize">{((payment as unknown as Record<string, unknown>).userRole as string)?.replace('_', ' ') || user?.role?.replace('_', ' ') || 'Job Seeker'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Submitted {formatTime(payment.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => setConfirmAction({ id: payment.id, type: 'local', action: 'approve' })}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setConfirmAction({ id: payment.id, type: 'local', action: 'reject' })}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
          
          {localPendingPayments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center glass-card rounded-2xl">
              <Check className="w-16 h-16 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No local pending payments</p>
            </div>
          )}
        </div>
        )}
      </main>
      
      {/* Screenshot Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl glass-card rounded-2xl overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-semibold">Payment Screenshot</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-2 hover:bg-secondary/50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {(() => {
                // Check all sources for the payment
                const cloudSub = pendingSubscriptions.find(p => p.id === selectedPayment)
                const cloudJob = pendingJobPayments.find(p => p.id === selectedPayment)
                const localPayment = localPendingPayments.find(p => p.id === selectedPayment)
                
                const screenshotUrl = cloudSub?.screenshotUrl || 
                                      cloudJob?.screenshotUrl || 
                                      localPayment?.screenshotUrl || 
                                      (localPayment as unknown as Record<string, unknown>)?.paymentScreenshot as string
                
                if (screenshotUrl) {
                  return (
                    <div className="rounded-xl overflow-hidden">
                      <img
                        src={screenshotUrl}
                        alt="Payment screenshot"
                        className="w-full max-h-[70vh] object-contain bg-secondary/30"
                      />
                    </div>
                  )
                }
                return (
                  <div className="aspect-video bg-secondary/50 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No screenshot uploaded</p>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 glass-card rounded-2xl animate-scale-in">
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                confirmAction.action === 'approve' ? 'bg-green-500/20' : 'bg-destructive/20'
              }`}>
                {confirmAction.action === 'approve' ? (
                  <Check className="w-8 h-8 text-green-400" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-destructive" />
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {confirmAction.action === 'approve' ? 'Approve Payment?' : 'Reject Payment?'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {confirmAction.action === 'approve'
                  ? 'This will activate the user\'s subscription for 30 days.'
                  : 'This will reject the payment and notify the user.'}
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmAction}
                  className={`flex-1 h-12 ${
                    confirmAction.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-destructive hover:bg-destructive/90'
                  }`}
                >
                  {confirmAction.action === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
