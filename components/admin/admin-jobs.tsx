'use client'

import { useState, useEffect } from 'react'
import { Search, Edit2, Trash2, MapPin, DollarSign, Clock, Building2, Eye, AlertCircle, Check, X, Phone, Image as ImageIcon, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdmin } from '@/lib/admin-context'
import { AdminSidebar } from './admin-sidebar'

interface JobPaymentRequest {
  id: string
  jobId: string
  salonOwnerId: string
  salonOwnerName?: string
  salonOwnerPhone?: string
  salonName: string
  salonMobile: string
  jobRole: string
  amount: number
  screenshotUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: Date
  processedAt?: Date
  rejectionReason?: string
}

type TabType = 'all' | 'pending_payments'

export function AdminJobs() {
  const { jobs, deleteJob } = useAdmin()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [pendingPayments, setPendingPayments] = useState<JobPaymentRequest[]>([])
  const [selectedPayment, setSelectedPayment] = useState<JobPaymentRequest | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ payment: JobPaymentRequest; action: 'approve' | 'reject' } | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Load pending job payments from localStorage
  useEffect(() => {
    const loadPendingPayments = () => {
      const stored = localStorage.getItem('fitone_admin_job_payments')
      if (stored) {
        const payments: JobPaymentRequest[] = JSON.parse(stored)
        setPendingPayments(payments.filter(p => p.status === 'pending'))
      }
    }
    
    loadPendingPayments()
    // Refresh every 5 seconds
    const interval = setInterval(loadPendingPayments, 5000)
    return () => clearInterval(interval)
  }, [])

  const filteredJobs = jobs.filter(job =>
    job.salonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.area.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = (jobId: string) => {
    deleteJob(jobId)
    setShowDeleteConfirm(null)
  }

  const handleApprovePayment = (payment: JobPaymentRequest) => {
    // Update payment status
    const stored = localStorage.getItem('fitone_admin_job_payments')
    if (stored) {
      const payments: JobPaymentRequest[] = JSON.parse(stored)
      const updated = payments.map(p => 
        p.id === payment.id 
          ? { ...p, status: 'approved' as const, processedAt: new Date() }
          : p
      )
      localStorage.setItem('fitone_admin_job_payments', JSON.stringify(updated))
    }
    
    // Update job status in pending jobs
    const pendingJobsKey = `fitone_pending_jobs_${payment.salonOwnerId}`
    const pendingJobs = localStorage.getItem(pendingJobsKey)
    if (pendingJobs) {
      const jobs = JSON.parse(pendingJobs)
      const updated = jobs.map((j: { id: string; status: string }) => 
        j.id === payment.jobId 
          ? { ...j, status: 'approved' }
          : j
      )
      localStorage.setItem(pendingJobsKey, JSON.stringify(updated))
    }
    
    // Add notification for salon owner
    const notificationsKey = `fitone_notifications_${payment.salonOwnerId}`
    const existingNotifications = localStorage.getItem(notificationsKey)
    const notifications = existingNotifications ? JSON.parse(existingNotifications) : []
    notifications.unshift({
      id: `notif_${Date.now()}`,
      type: 'payment_approved',
      title: 'Payment Approved!',
      message: `Your job post for "${payment.jobRole}" has been approved. You can now publish it.`,
      isRead: false,
      createdAt: new Date(),
    })
    localStorage.setItem(notificationsKey, JSON.stringify(notifications))
    
    // Refresh pending payments
    setPendingPayments(prev => prev.filter(p => p.id !== payment.id))
    setConfirmAction(null)
  }

  const handleRejectPayment = (payment: JobPaymentRequest) => {
    // Update payment status
    const stored = localStorage.getItem('fitone_admin_job_payments')
    if (stored) {
      const payments: JobPaymentRequest[] = JSON.parse(stored)
      const updated = payments.map(p => 
        p.id === payment.id 
          ? { ...p, status: 'rejected' as const, processedAt: new Date(), rejectionReason }
          : p
      )
      localStorage.setItem('fitone_admin_job_payments', JSON.stringify(updated))
    }
    
    // Update job status in pending jobs
    const pendingJobsKey = `fitone_pending_jobs_${payment.salonOwnerId}`
    const pendingJobs = localStorage.getItem(pendingJobsKey)
    if (pendingJobs) {
      const jobs = JSON.parse(pendingJobs)
      const updated = jobs.map((j: { id: string; status: string }) => 
        j.id === payment.jobId 
          ? { ...j, status: 'rejected' }
          : j
      )
      localStorage.setItem(pendingJobsKey, JSON.stringify(updated))
    }
    
    // Add notification for salon owner
    const notificationsKey = `fitone_notifications_${payment.salonOwnerId}`
    const existingNotifications = localStorage.getItem(notificationsKey)
    const notifications = existingNotifications ? JSON.parse(existingNotifications) : []
    notifications.unshift({
      id: `notif_${Date.now()}`,
      type: 'payment_rejected',
      title: 'Payment Rejected',
      message: `Your payment for "${payment.jobRole}" was rejected. ${rejectionReason ? `Reason: ${rejectionReason}` : 'Please contact support.'}`,
      isRead: false,
      createdAt: new Date(),
    })
    localStorage.setItem(notificationsKey, JSON.stringify(notifications))
    
    // Refresh pending payments
    setPendingPayments(prev => prev.filter(p => p.id !== payment.id))
    setConfirmAction(null)
    setRejectionReason('')
  }

  const formatTime = (date: Date) => {
    const d = new Date(date)
    const hours = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60))
    if (hours < 1) return 'Just now'
    if (hours === 1) return '1 hour ago'
    if (hours < 24) return `${hours} hours ago`
    return `${Math.floor(hours / 24)} days ago`
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Job Management</h1>
          <p className="text-muted-foreground">View and manage job postings & payments</p>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            All Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab('pending_payments')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
              activeTab === 'pending_payments'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            Pending Payments
            {pendingPayments.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
                {pendingPayments.length}
              </span>
            )}
          </button>
        </div>
        
        {/* Pending Payments Tab */}
        {activeTab === 'pending_payments' && (
          <div className="space-y-4">
            {/* Pending Count */}
            <div className="p-4 glass-card rounded-xl flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingPayments.length}</p>
                <p className="text-sm text-muted-foreground">Pending Job Payment Approvals</p>
              </div>
            </div>
            
            {pendingPayments.map((payment, index) => (
              <div
                key={payment.id}
                className="p-6 glass-card rounded-2xl animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Payment Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                        <Building2 className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{payment.salonName}</h3>
                        <p className="text-muted-foreground">{payment.jobRole}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Submitted {formatTime(payment.submittedAt)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Owner Details */}
                    <div className="p-3 bg-secondary/30 rounded-lg mb-4">
                      <h4 className="text-sm font-medium mb-2">Salon Owner Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <span className="ml-2">{payment.salonOwnerName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="ml-2">{payment.salonOwnerPhone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Salon Mobile:</span>
                          <span className="ml-2">{payment.salonMobile}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="ml-2 text-primary font-semibold">₹{payment.amount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPayment(payment)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Screenshot
                    </Button>
                    <Button
                      onClick={() => setConfirmAction({ payment, action: 'approve' })}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setConfirmAction({ payment, action: 'reject' })}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {pendingPayments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center glass-card rounded-2xl">
                <Check className="w-16 h-16 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground">No pending job payment approvals</p>
              </div>
            )}
          </div>
        )}
        
        {/* All Jobs Tab */}
        {activeTab === 'all' && (
          <>
            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search jobs, salons, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-12 bg-secondary/50 border-border/50"
                />
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-4 glass-card rounded-xl">
                <p className="text-2xl font-bold">{jobs.length}</p>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
              </div>
              <div className="p-4 glass-card rounded-xl">
                <p className="text-2xl font-bold text-green-400">{jobs.filter(j => j.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Live Jobs</p>
              </div>
              <div className="p-4 glass-card rounded-xl">
                <p className="text-2xl font-bold text-accent">{pendingPayments.length}</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
              <div className="p-4 glass-card rounded-xl">
                <p className="text-2xl font-bold text-muted-foreground">{jobs.filter(j => !j.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Inactive Jobs</p>
              </div>
            </div>
            
            {/* Jobs List */}
            <div className="space-y-4">
              {filteredJobs.map((job, index) => (
                <div
                  key={job.id}
                  className="p-6 glass-card rounded-2xl animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Job Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                          <Building2 className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-lg">{job.role}</h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              job.isActive ? 'bg-green-500/20 text-green-400' : 'bg-secondary text-muted-foreground'
                            }`}>
                              {job.isActive ? 'Live' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{job.salonName}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <span className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-primary/10 text-primary">
                          <DollarSign className="w-4 h-4" />
                          {job.salary}
                        </span>
                        <span className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-secondary text-foreground">
                          <Clock className="w-4 h-4" />
                          {job.experience}
                        </span>
                        <span className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-secondary text-foreground">
                          <MapPin className="w-4 h-4" />
                          {job.location.area}
                        </span>
                        {job.contact && (
                          <span className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-secondary text-foreground">
                            <Phone className="w-4 h-4" />
                            {job.contact}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(job.id)}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredJobs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center glass-card rounded-2xl">
                  <Search className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No jobs found</h3>
                  <p className="text-sm text-muted-foreground">Try adjusting your search</p>
                </div>
              )}
            </div>
          </>
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
              {selectedPayment.screenshotUrl ? (
                <div className="rounded-xl overflow-hidden">
                  <img
                    src={selectedPayment.screenshotUrl}
                    alt="Payment screenshot"
                    className="w-full max-h-[70vh] object-contain bg-secondary/30"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-secondary/50 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No screenshot uploaded</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 glass-card rounded-2xl animate-scale-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-bold mb-2">Delete Job?</h3>
              <p className="text-muted-foreground mb-6">
                This action cannot be undone. The job posting will be permanently removed.
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 h-12 bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Approve/Reject Confirmation Modal */}
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
              <p className="text-muted-foreground mb-4">
                {confirmAction.action === 'approve'
                  ? 'The salon owner will be able to publish their job post.'
                  : 'The salon owner will be notified of the rejection.'}
              </p>
              
              {confirmAction.action === 'reject' && (
                <div className="w-full mb-4">
                  <Input
                    placeholder="Rejection reason (optional)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="bg-secondary/50"
                  />
                </div>
              )}
              
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmAction(null)
                    setRejectionReason('')
                  }}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (confirmAction.action === 'approve') {
                      handleApprovePayment(confirmAction.payment)
                    } else {
                      handleRejectPayment(confirmAction.payment)
                    }
                  }}
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
