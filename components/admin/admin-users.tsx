'use client'

import { useState, useEffect } from 'react'
import { Search, User, Shield, ShieldOff, Mail, Phone, Briefcase, Building2, Clock, Check, X, Eye, MapPin, DollarSign, FileText, IdCard, Camera, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdmin } from '@/lib/admin-context'
import { AdminSidebar } from './admin-sidebar'
import { getPendingJobAlerts, approveJobAlert, rejectJobAlert, type JobAlert, getAllJobAlerts, getAllJobSeekers, type JobSeeker, getAllSalonProfiles } from '@/lib/data-store'
import type { SalonProfile } from '@/lib/types'

type FilterType = 'all' | 'job_seeker' | 'employer'
type TabType = 'users' | 'job_alerts'

interface ExtendedUser {
  id: string
  email: string
  phone: string
  role: string
  isSubscribed: boolean
  isBlocked?: boolean
  createdAt: Date
  // Job seeker fields
  jobSeekerProfile?: JobSeeker
  jobAlert?: JobAlert
  // Salon owner fields
  salonProfile?: SalonProfile
}

export function AdminUsers() {
  const { users, toggleUserBlock } = useAdmin()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('users')
  const [pendingJobAlerts, setPendingJobAlerts] = useState<JobAlert[]>([])
  const [selectedAlert, setSelectedAlert] = useState<JobAlert | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ alert: JobAlert; action: 'approve' | 'reject' } | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [extendedUsers, setExtendedUsers] = useState<ExtendedUser[]>([])

  // Load pending job alerts and build extended user data
  useEffect(() => {
    const loadData = () => {
      const alerts = getPendingJobAlerts()
      setPendingJobAlerts(alerts)
      
      // Build extended user data with profiles
      const allAlerts = getAllJobAlerts()
      const jobSeekers = getAllJobSeekers()
      const salonProfiles = getAllSalonProfiles()
      
      const extended = users.map(user => {
        const extUser: ExtendedUser = {
          ...user,
          isBlocked: (user as any).isBlocked,
        }
        
        if (user.role === 'job_seeker') {
          extUser.jobSeekerProfile = jobSeekers.find(js => js.userId === user.id)
          extUser.jobAlert = allAlerts.find(a => a.userId === user.id)
        } else if (user.role === 'salon_owner' || user.role === 'employer') {
          extUser.salonProfile = salonProfiles.find(sp => sp.ownerId === user.id)
        }
        
        return extUser
      })
      
      setExtendedUsers(extended)
    }
    
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [users])

  const filteredUsers = extendedUsers.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery)
    const matchesFilter = filter === 'all' || 
      user.role === filter || 
      (filter === 'employer' && (user.role === 'salon_owner' || user.role === 'employer'))
    return matchesSearch && matchesFilter
  })

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    const d = new Date(date)
    const hours = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60))
    if (hours < 1) return 'Just now'
    if (hours === 1) return '1 hour ago'
    if (hours < 24) return `${hours} hours ago`
    return `${Math.floor(hours / 24)} days ago`
  }

  const handleApproveAlert = (alert: JobAlert) => {
    approveJobAlert(alert.id, 'admin')
    setPendingJobAlerts(prev => prev.filter(a => a.id !== alert.id))
    setConfirmAction(null)
  }

  const handleRejectAlert = (alert: JobAlert) => {
    rejectJobAlert(alert.id, 'admin', rejectionReason)
    setPendingJobAlerts(prev => prev.filter(a => a.id !== alert.id))
    setConfirmAction(null)
    setRejectionReason('')
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">View and manage all users</p>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            All Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('job_alerts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
              activeTab === 'job_alerts'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            Pending Job Alerts
            {pendingJobAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
                {pendingJobAlerts.length}
              </span>
            )}
          </button>
        </div>
        
        {/* Users Tab */}
        {activeTab === 'users' && (
        <>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 bg-secondary/50 border-border/50"
            />
          </div>
          
          {/* Filter Buttons */}
          <div className="flex gap-2">
            {(['all', 'job_seeker', 'employer'] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                onClick={() => setFilter(f)}
                className={filter === f ? 'bg-primary' : ''}
              >
                {f === 'all' ? 'All' : f === 'job_seeker' ? 'Job Seekers' : 'Salon Owners'}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 glass-card rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </div>
          <div className="p-4 glass-card rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'job_seeker').length}</p>
                <p className="text-xs text-muted-foreground">Job Seekers</p>
              </div>
            </div>
          </div>
          <div className="p-4 glass-card rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'salon_owner' || u.role === 'employer').length}</p>
                <p className="text-xs text-muted-foreground">Employers</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Users Table/List */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-secondary/30 text-sm font-medium text-muted-foreground">
            <div className="col-span-4">User</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Joined</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          
          {/* Users List */}
          <div className="divide-y divide-border/30">
            {filteredUsers.map((user, index) => (
              <div
                key={user.id}
                className="p-4 hover:bg-secondary/20 transition-colors animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* User Info */}
                  <div className="md:col-span-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
                      user.role === 'job_seeker' ? 'bg-blue-500/20' : 'bg-accent/20'
                    }`}>
                      {user.role === 'job_seeker' && user.jobAlert?.passportPhotoUrl ? (
                        <img 
                          src={user.jobAlert.passportPhotoUrl} 
                          alt={user.email} 
                          className="w-full h-full object-cover"
                        />
                      ) : user.salonProfile?.logoUrl ? (
                        <img 
                          src={user.salonProfile.logoUrl} 
                          alt={user.salonProfile.salonName} 
                          className="w-full h-full object-cover"
                        />
                      ) : user.role === 'job_seeker' ? (
                        <Briefcase className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Building2 className="w-5 h-5 text-accent" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {user.phone}
                      </p>
                    </div>
                  </div>
                  
                  {/* Role */}
                  <div className="md:col-span-2">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                      user.role === 'job_seeker' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-accent/20 text-accent'
                    }`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {/* Status */}
                  <div className="md:col-span-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.isSubscribed 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-secondary text-muted-foreground'
                    }`}>
                      {user.isSubscribed ? 'Subscribed' : 'Free'}
                    </span>
                  </div>
                  
                  {/* Joined Date */}
                  <div className="md:col-span-2 text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </div>
                  
                  {/* Actions */}
                  <div className="md:col-span-2 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleUserBlock(user.id)}
                      className={`flex items-center gap-2 ${
                        user.isBlocked ? 'text-green-400' : 'text-destructive'
                      }`}
                    >
                      {user.isBlocked ? (
                        <>
                          <Shield className="w-4 h-4" />
                          Unblock
                        </>
                      ) : (
                        <>
                          <ShieldOff className="w-4 h-4" />
                          Block
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <User className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No users found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
        </>
        )}
        
        {/* Job Alerts Tab */}
        {activeTab === 'job_alerts' && (
          <div className="space-y-4">
            {/* Pending Count */}
            <div className="p-4 glass-card rounded-xl flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingJobAlerts.length}</p>
                <p className="text-sm text-muted-foreground">Pending Job Seeker Profile Approvals</p>
              </div>
            </div>
            
            {pendingJobAlerts.map((alert, index) => (
              <div
                key={alert.id}
                className="p-6 glass-card rounded-2xl animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Alert Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {alert.passportPhotoUrl ? (
                          <img
                            src={alert.passportPhotoUrl}
                            alt={alert.userName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-7 h-7 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{alert.userName}</h3>
                        <p className="text-muted-foreground">{alert.role}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Submitted {formatTime(alert.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Details */}
                    <div className="p-3 bg-secondary/30 rounded-lg mb-4">
                      <h4 className="text-sm font-medium mb-2">Profile Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span>{alert.userPhone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span>{alert.userEmail || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3 h-3 text-muted-foreground" />
                          <span>{alert.experience}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3 text-muted-foreground" />
                          <span>{alert.salaryExpectation}</span>
                        </div>
                        <div className="flex items-center gap-2 col-span-2">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate">{alert.location?.address || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Identity Proof */}
                    {alert.identityProofUrl && (
                      <div className="p-3 bg-secondary/30 rounded-lg mb-4">
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <IdCard className="w-4 h-4" />
                          Identity Proof ({alert.identityProofType || 'Document'})
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(alert.identityProofUrl, '_blank')}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Identity Proof
                        </Button>
                      </div>
                    )}
                    
                    {/* Skills */}
                    {alert.skills && alert.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {alert.skills.slice(0, 5).map((skill, i) => (
                          <span key={i} className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                            {skill}
                          </span>
                        ))}
                        {alert.skills.length > 5 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-secondary text-muted-foreground">
                            +{alert.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {alert.passportPhotoUrl && (
                      <Button
                        variant="outline"
                        onClick={() => setSelectedAlert(alert)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Photo
                      </Button>
                    )}
                    <Button
                      onClick={() => setConfirmAction({ alert, action: 'approve' })}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setConfirmAction({ alert, action: 'reject' })}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {pendingJobAlerts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center glass-card rounded-2xl">
                <Check className="w-16 h-16 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground">No pending job seeker profile approvals</p>
              </div>
            )}
          </div>
        )}
        
        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl animate-scale-in">
              <div className="p-4 border-b border-border/50 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-sm">
                <h3 className="font-semibold text-lg">User Details</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-secondary/50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="flex items-center gap-4">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden ${
                    selectedUser.role === 'job_seeker' ? 'bg-blue-500/20' : 'bg-accent/20'
                  }`}>
                    {selectedUser.role === 'job_seeker' && selectedUser.jobAlert?.passportPhotoUrl ? (
                      <img 
                        src={selectedUser.jobAlert.passportPhotoUrl} 
                        alt={selectedUser.email} 
                        className="w-full h-full object-cover"
                      />
                    ) : selectedUser.salonProfile?.logoUrl ? (
                      <img 
                        src={selectedUser.salonProfile.logoUrl} 
                        alt={selectedUser.salonProfile.salonName} 
                        className="w-full h-full object-cover"
                      />
                    ) : selectedUser.role === 'job_seeker' ? (
                      <Briefcase className="w-10 h-10 text-blue-400" />
                    ) : (
                      <Building2 className="w-10 h-10 text-accent" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedUser.role === 'job_seeker' 
                        ? selectedUser.jobAlert?.userName || selectedUser.jobSeekerProfile?.name || selectedUser.email
                        : selectedUser.salonProfile?.ownerName || selectedUser.email}
                    </h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                        selectedUser.role === 'job_seeker' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-accent/20 text-accent'
                      }`}>
                        {selectedUser.role.replace('_', ' ')}
                      </span>
                      {selectedUser.isSubscribed && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
                          Subscribed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Contact Info */}
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedUser.phone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Joined</p>
                      <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">{selectedUser.isBlocked ? 'Blocked' : 'Active'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Job Seeker Details */}
                {selectedUser.role === 'job_seeker' && (selectedUser.jobAlert || selectedUser.jobSeekerProfile) && (
                  <>
                    {/* Profile Details */}
                    <div className="p-4 bg-secondary/30 rounded-lg">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Job Seeker Profile
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Role</p>
                          <p className="font-medium">{selectedUser.jobAlert?.role || selectedUser.jobSeekerProfile?.role || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Experience</p>
                          <p className="font-medium">{selectedUser.jobAlert?.experience || selectedUser.jobSeekerProfile?.experience || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Salary Expectation</p>
                          <p className="font-medium">{selectedUser.jobAlert?.salaryExpectation || selectedUser.jobSeekerProfile?.salaryExpectation || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Profile Status</p>
                          <p className={`font-medium ${
                            selectedUser.jobAlert?.status === 'approved' ? 'text-green-400' : 
                            selectedUser.jobAlert?.status === 'pending' ? 'text-yellow-400' : 
                            selectedUser.jobAlert?.status === 'rejected' ? 'text-red-400' : ''
                          }`}>
                            {selectedUser.jobAlert?.status?.charAt(0).toUpperCase() + selectedUser.jobAlert?.status?.slice(1) || 'N/A'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Location</p>
                          <p className="font-medium">{selectedUser.jobAlert?.location?.address || selectedUser.jobSeekerProfile?.location?.address || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Skills */}
                    {(selectedUser.jobAlert?.skills || selectedUser.jobSeekerProfile?.skills) && (
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(selectedUser.jobAlert?.skills || selectedUser.jobSeekerProfile?.skills || []).map((skill, i) => (
                            <span key={i} className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Photos & Documents */}
                    <div className="p-4 bg-secondary/30 rounded-lg">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        Photos & Documents
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Passport Photo */}
                        <div>
                          <p className="text-muted-foreground text-sm mb-2">Profile Photo</p>
                          {selectedUser.jobAlert?.passportPhotoUrl ? (
                            <div className="relative">
                              <img 
                                src={selectedUser.jobAlert.passportPhotoUrl} 
                                alt="Profile" 
                                className="w-full h-40 object-cover rounded-lg"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="absolute bottom-2 right-2"
                                onClick={() => window.open(selectedUser.jobAlert?.passportPhotoUrl, '_blank')}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="w-full h-40 bg-secondary/50 rounded-lg flex items-center justify-center">
                              <p className="text-muted-foreground text-sm">No photo</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Identity Proof */}
                        <div>
                          <p className="text-muted-foreground text-sm mb-2">
                            Identity Proof {selectedUser.jobAlert?.identityProofType && `(${selectedUser.jobAlert.identityProofType})`}
                          </p>
                          {selectedUser.jobAlert?.identityProofUrl ? (
                            <div className="relative">
                              <img 
                                src={selectedUser.jobAlert.identityProofUrl} 
                                alt="Identity Proof" 
                                className="w-full h-40 object-cover rounded-lg"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="absolute bottom-2 right-2"
                                onClick={() => window.open(selectedUser.jobAlert?.identityProofUrl, '_blank')}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="w-full h-40 bg-secondary/50 rounded-lg flex items-center justify-center">
                              <p className="text-muted-foreground text-sm">No document</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Salon Owner Details */}
                {(selectedUser.role === 'salon_owner' || selectedUser.role === 'employer') && selectedUser.salonProfile && (
                  <>
                    {/* Salon Details */}
                    <div className="p-4 bg-secondary/30 rounded-lg">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Salon Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Salon Name</p>
                          <p className="font-medium">{selectedUser.salonProfile.salonName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Owner Name</p>
                          <p className="font-medium">{selectedUser.salonProfile.ownerName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mobile</p>
                          <p className="font-medium">{selectedUser.salonProfile.mobile}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedUser.salonProfile.email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Verified</p>
                          <p className={`font-medium ${selectedUser.salonProfile.isVerified ? 'text-green-400' : 'text-muted-foreground'}`}>
                            {selectedUser.salonProfile.isVerified ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Contact Credits</p>
                          <p className="font-medium">{selectedUser.salonProfile.contactCredits || 0}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Address</p>
                          <p className="font-medium">{selectedUser.salonProfile.address}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">City</p>
                          <p className="font-medium">{selectedUser.salonProfile.city}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">State</p>
                          <p className="font-medium">{selectedUser.salonProfile.state}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Working Hours</p>
                          <p className="font-medium">{selectedUser.salonProfile.workingHours || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Salon Logo */}
                    {selectedUser.salonProfile.logoUrl && (
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Camera className="w-4 h-4" />
                          Salon Logo
                        </h4>
                        <div className="relative w-40 h-40">
                          <img 
                            src={selectedUser.salonProfile.logoUrl} 
                            alt="Salon Logo" 
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute bottom-2 right-2"
                            onClick={() => window.open(selectedUser.salonProfile?.logoUrl, '_blank')}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Description */}
                    {selectedUser.salonProfile.description && (
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <h4 className="font-medium mb-3">Description</h4>
                        <p className="text-sm text-muted-foreground">{selectedUser.salonProfile.description}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Photo Preview Modal */}
        {selectedAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-md glass-card rounded-2xl overflow-hidden animate-scale-in">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <h3 className="font-semibold">{selectedAlert.userName}&apos;s Photo</h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="p-2 hover:bg-secondary/50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                {selectedAlert.passportPhotoUrl ? (
                  <img
                    src={selectedAlert.passportPhotoUrl}
                    alt={selectedAlert.userName}
                    className="w-full max-h-96 object-contain rounded-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <User className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No photo uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Confirm Action Modal */}
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-md glass-card rounded-2xl overflow-hidden animate-scale-in">
              <div className="p-4 border-b border-border/50">
                <h3 className="font-semibold">
                  {confirmAction.action === 'approve' ? 'Approve Profile' : 'Reject Profile'}
                </h3>
              </div>
              <div className="p-6">
                <p className="text-muted-foreground mb-4">
                  {confirmAction.action === 'approve'
                    ? `Are you sure you want to approve ${confirmAction.alert.userName}'s profile?`
                    : `Are you sure you want to reject ${confirmAction.alert.userName}'s profile?`
                  }
                </p>
                
                {confirmAction.action === 'reject' && (
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block">Rejection Reason (optional)</label>
                    <Input
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      className="bg-secondary/50"
                    />
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmAction(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (confirmAction.action === 'approve') {
                        handleApproveAlert(confirmAction.alert)
                      } else {
                        handleRejectAlert(confirmAction.alert)
                      }
                    }}
                    className={`flex-1 ${
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
      </main>
    </div>
  )
}
