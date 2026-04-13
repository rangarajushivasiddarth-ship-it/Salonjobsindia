'use client'

import { useState } from 'react'
import { Check, X, Eye, Image as ImageIcon, Clock, User, AlertCircle, Crown } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useAdmin } from '@/lib/admin-context'
import { AdminSidebar } from './admin-sidebar'
import { JOB_SEEKER_PLANS } from '@/lib/data-store'

export function AdminPayments() {
  const { pendingPayments, users, approvePayment, rejectPayment } = useAdmin()
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null)

  const formatTime = (date: Date) => {
    const hours = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60))
    if (hours < 1) return 'Just now'
    if (hours === 1) return '1 hour ago'
    if (hours < 24) return `${hours} hours ago`
    return `${Math.floor(hours / 24)} days ago`
  }

  const handleConfirmAction = () => {
    if (!confirmAction) return
    
    if (confirmAction.action === 'approve') {
      approvePayment(confirmAction.id)
    } else {
      rejectPayment(confirmAction.id)
    }
    
    setConfirmAction(null)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Payment Approvals</h1>
          <p className="text-muted-foreground">Review and approve payment screenshots</p>
        </div>
        
        {/* Pending Count */}
        <div className="mb-6 p-4 glass-card rounded-xl flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold">{pendingPayments.length}</p>
            <p className="text-sm text-muted-foreground">Pending Approvals</p>
          </div>
        </div>
        
        {/* Payments List */}
        <div className="space-y-4">
          {pendingPayments.map((payment, index) => {
            const user = users.find(u => u.id === payment.userId)
            
            return (
              <div
                key={payment.id}
                className="p-6 glass-card rounded-2xl animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* User Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{user?.email || 'Unknown User'}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{user?.phone || 'No phone'}</span>
                        <span>•</span>
                        <span className="capitalize">{user?.role?.replace('_', ' ') || 'Unknown'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Submitted {formatTime(payment.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPayment(payment.id)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Screenshot
                    </Button>
                    <Button
                      onClick={() => setConfirmAction({ id: payment.id, action: 'approve' })}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setConfirmAction({ id: payment.id, action: 'reject' })}
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
          
          {pendingPayments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center glass-card rounded-2xl">
              <Check className="w-16 h-16 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No pending payment approvals</p>
            </div>
          )}
        </div>
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
              <div className="aspect-video bg-secondary/50 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Screenshot preview</p>
                  <p className="text-xs text-muted-foreground mt-1">In production, the actual screenshot would be displayed here</p>
                </div>
              </div>
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
