'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Briefcase, Users, Settings, LogOut, Edit2, Trash2, Eye, ChevronRight, Building2, MapPin, DollarSign, Clock, Crown, User, Search, Filter, TrendingUp, UserCheck, Bell, BarChart3, MessageCircle, Phone, AlertCircle, Check, X, Rocket, ShoppingCart, BadgeCheck, Shield, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/lib/app-context'
import { useLanguage } from '@/lib/language-context'
import { SyncService as RealTimeSync } from '@/lib/sync-service'
import { getMessagesForOwner, getAllJobs, getUnreadMessageCount, getApplicationsBySalonId, getAllJobSeekers, isCandidateUnlocked, deductSalonCredit, getSalonProfileByOwnerId } from '@/lib/data-store'
import type { Job, Application, CONTACT_CREDIT_PACKS } from '@/lib/types'
import type { JobSeeker } from '@/lib/data-store'

// Credit pack data
const CREDIT_PACKS = [
  {
    id: 'credit_pack_15',
    name: '15 Credits Pack',
    credits: 15,
    price: 199,
    features: [
      'Unlock 15 job seeker contacts',
      '1 credit = 1 contact unlock',
      'Never expires',
      'Instant activation after approval'
    ]
  },
  {
    id: 'credit_pack_50',
    name: '50 Credits Pack',
    credits: 50,
    price: 499,
    features: [
      'Unlock 50 job seeker contacts',
      '1 credit = 1 contact unlock',
      'Never expires',
      'Instant activation after approval',
      'Best value - save Rs.149'
    ],
    recommended: true
  }
]

// Verified Badge Plans
const VERIFIED_BADGE_PLANS = [
  {
    id: 'verified_1_month',
    name: '1 Month Verified',
    price: 199,
    durationMonths: 1,
    validityDays: 30,
    features: [
      'Verified badge on your salon profile',
      'Verified badge on all job posts',
      'Build trust with job seekers',
      'Stand out from other salons'
    ]
  },
  {
    id: 'verified_3_months',
    name: '3 Months Verified',
    price: 499,
    durationMonths: 3,
    validityDays: 90,
    features: [
      'Verified badge on your salon profile',
      'Verified badge on all job posts',
      'Build trust with job seekers',
      'Stand out from other salons',
      'Save Rs.98 compared to monthly'
    ],
    recommended: true,
    savings: 'Save Rs.98'
  }
]

type TabType = 'dashboard' | 'jobs' | 'applicants' | 'candidates' | 'settings'

export function OwnerPanel() {
  const { user, logout, goToStep } = useApp()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false)
  const [showVerifiedBadgeModal, setShowVerifiedBadgeModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All')
  const [selectedApplicant, setSelectedApplicant] = useState<Application | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<JobSeeker | null>(null)
  const [showEditJob, setShowEditJob] = useState<Job | null>(null)
  
  // Real data state
  const [ownerJobs, setOwnerJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [candidates, setCandidates] = useState<JobSeeker[]>([])
  const [salonProfile, setSalonProfile] = useState<ReturnType<typeof getSalonProfileByOwnerId>>(null)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Load real data
  const loadData = useCallback(() => {
    if (!user?.id) return
    
    // Get salon profile
    const profile = getSalonProfileByOwnerId(user.id)
    setSalonProfile(profile)
    
    // Get owner's jobs (only real jobs, no mock data)
    const allJobs = getAllJobs()
    const myJobs = allJobs.filter(j => j.salonId === user.id)
    setOwnerJobs(myJobs)
    
    // Get applications for owner's jobs
    const myApplications = getApplicationsBySalonId(user.id)
    setApplications(myApplications)
    
    // Get all job seekers (candidates)
    const allCandidates = getAllJobSeekers()
    setCandidates(allCandidates)
    
    // Get unread messages
    setUnreadMessages(getUnreadMessageCount(user.id))
    
    setIsLoading(false)
  }, [user?.id])

  useEffect(() => {
    loadData()
    
    // Listen for new applications in real-time
    const unsubscribe = RealTimeSync.subscribe('application_created', () => {
      loadData()
    })
    
    // Set up polling for real-time updates
    const interval = setInterval(loadData, 10000)
    
    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [loadData])

  // Calculate real stats
  const stats = {
    totalJobs: ownerJobs.length,
    liveJobs: ownerJobs.filter(j => j.status === 'live').length,
    totalApplications: applications.length,
    newApplications: applications.filter(a => a.status === 'applied').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    selected: applications.filter(a => a.status === 'selected').length,
    totalViews: ownerJobs.reduce((sum, j) => sum + (j.viewsCount || 0), 0),
    contactCredits: salonProfile?.contactCredits || 0,
  }

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-secondary text-muted-foreground'
      case 'pending_payment': return 'bg-amber-500/20 text-amber-400'
      case 'pending_approval': return 'bg-blue-500/20 text-blue-400'
      case 'live': return 'bg-green-500/20 text-green-400'
      case 'expired': return 'bg-red-500/20 text-red-400'
      case 'deleted': return 'bg-gray-500/20 text-gray-400'
      default: return 'bg-secondary text-muted-foreground'
    }
  }
  
  const getJobStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft'
      case 'pending_payment': return 'Payment Pending'
      case 'pending_approval': return 'Under Review'
      case 'live': return 'Live'
      case 'expired': return 'Expired'
      case 'deleted': return 'Deleted'
      default: return status
    }
  }

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-500/20 text-blue-400'
      case 'viewed': return 'bg-amber-500/20 text-amber-400'
      case 'shortlisted': return 'bg-primary/20 text-primary'
      case 'selected': return 'bg-green-500/20 text-green-400'
      case 'rejected': return 'bg-red-500/20 text-red-400'
      default: return 'bg-secondary text-muted-foreground'
    }
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const handleDeleteJob = (jobId: string) => {
    // Update job status to deleted in localStorage
    const jobs = getAllJobs()
    const updatedJobs = jobs.map(j => 
      j.id === jobId ? { ...j, status: 'deleted' as const, isActive: false } : j
    )
    localStorage.setItem('salonjobsindia_jobs', JSON.stringify(updatedJobs))
    
    // Update local state
    setOwnerJobs(prev => prev.filter(j => j.id !== jobId))
    setShowDeleteConfirm(null)
  }

  const handleEditJob = (job: Job) => {
    if ((job.editsUsed || 0) >= (job.maxEdits || 3)) {
      alert('You have used all 3 edit attempts for this job.')
      return
    }
    setShowEditJob(job)
  }

  const handleUnlockCandidate = (candidateId: string) => {
    if (!user?.id) return
    
    const success = deductSalonCredit(user.id, candidateId)
    if (success) {
      loadData() // Refresh data
    } else {
      alert('Not enough contact credits. Please purchase more credits.')
    }
  }

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = !searchQuery || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location?.address?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRoleFilter === 'All' || c.role === selectedRoleFilter
    return matchesSearch && matchesRole
  })

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'applicants', label: 'Applicants', icon: Users },
    { id: 'candidates', label: 'Find Talent', icon: UserCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden pb-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-primary/10 to-transparent" />
      
      {/* Header */}
      <header className="relative z-10 p-4 glass">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold">{salonProfile?.salonName || 'Salon Dashboard'}</h1>
              <p className="text-sm text-muted-foreground">{user?.name || user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => goToStep('messages')}
              className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center relative"
            >
              <MessageCircle className="w-5 h-5 text-foreground" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">{unreadMessages}</span>
              )}
            </button>
            <button 
              onClick={() => goToStep('notifications')}
              className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center relative"
            >
              <Bell className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-3 glass-card rounded-xl text-center">
            <p className="text-xl font-bold text-primary">{stats.liveJobs}</p>
            <p className="text-[10px] text-muted-foreground">Live Jobs</p>
          </div>
          <div className="p-3 glass-card rounded-xl text-center">
            <p className="text-xl font-bold text-accent">{stats.totalApplications}</p>
            <p className="text-[10px] text-muted-foreground">Applications</p>
          </div>
          <div className="p-3 glass-card rounded-xl text-center">
            <p className="text-xl font-bold text-green-400">{stats.selected}</p>
            <p className="text-[10px] text-muted-foreground">Selected</p>
          </div>
          <div className="p-3 glass-card rounded-xl text-center">
            <p className="text-xl font-bold text-foreground">{stats.contactCredits}</p>
            <p className="text-[10px] text-muted-foreground">Credits</p>
          </div>
        </div>
      </header>
      
      {/* Tabs */}
      <div className="relative z-10 px-4 py-3">
        <div className="flex gap-1 p-1 bg-secondary/30 rounded-xl overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="relative z-10 flex-1 px-4 pb-4 overflow-y-auto">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-slide-up">
            {/* Welcome Card */}
            {ownerJobs.length === 0 && (
              <div className="p-6 glass-card rounded-2xl text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Welcome to Your Dashboard</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Post your first job to start receiving applications from qualified candidates.
                </p>
                <Button onClick={() => goToStep('create-job')} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Post Your First Job
                </Button>
              </div>
            )}

            {/* Recent Applications */}
            {applications.length > 0 && (
              <div className="p-5 glass-card rounded-2xl">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Recent Applications
                </h3>
                <div className="space-y-3">
                  {applications.slice(0, 5).map((app) => (
                    <div key={app.id} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{app.candidateName}</p>
                        <p className="text-xs text-muted-foreground">Applied for {app.jobRole}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getApplicationStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => goToStep('create-job')} className="h-14 bg-primary hover:bg-primary/90">
                <Plus className="w-5 h-5 mr-2" />
                Post Job (Rs.499)
              </Button>
              <Button onClick={() => setActiveTab('candidates')} variant="outline" className="h-14 border-primary/50 text-primary">
                <Search className="w-5 h-5 mr-2" />
                Find Talent
              </Button>
            </div>
            
            {/* Verified Badge Promo - Show only if not verified */}
            {!salonProfile?.isVerified && (
              <div className="p-5 glass-card rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <BadgeCheck className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-400 mb-1">Get Verified Badge</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Stand out from other salons with a verified badge. Job seekers trust verified salons more.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">Rs.199/month</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">Rs.499/3 months - Save Rs.98</span>
                    </div>
                    <Button 
                      onClick={() => setShowVerifiedBadgeModal(true)} 
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Get Verified Now
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show verified status if verified */}
            {salonProfile?.isVerified && (
              <div className="p-4 glass-card rounded-2xl border-2 border-blue-500/50 bg-blue-500/10">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="font-semibold text-blue-400">Verified Salon</p>
                    <p className="text-xs text-muted-foreground">
                      Valid until {salonProfile.verifiedUntil ? new Date(salonProfile.verifiedUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-4 animate-slide-up">
            <Button onClick={() => goToStep('create-job')} className="w-full h-14 bg-primary hover:bg-primary/90 gold-glow">
              <Plus className="w-5 h-5 mr-2" />
              Post New Job (Rs.499)
            </Button>
            
            {ownerJobs.length === 0 ? (
              <div className="p-8 glass-card rounded-2xl text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No Jobs Posted Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Post your first job to start receiving applications.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {ownerJobs.map((job) => (
                  <div key={job.id} className="p-4 glass-card rounded-2xl border border-border/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{job.role}</h3>
                        <p className="text-sm text-muted-foreground">{job.salonName}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getJobStatusColor(job.status)}`}>
                        {getJobStatusLabel(job.status)}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                        <DollarSign className="w-3 h-3" />
                        {job.salaryFixed || job.salaryRange || 'Negotiable'}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-secondary/80 text-foreground">
                        <Clock className="w-3 h-3" />
                        {job.experience}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {job.viewsCount || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {job.applicationsCount || 0} applications
                      </span>
                      <span>
                        Edits: {job.editsUsed || 0}/{job.maxEdits || 3}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditJob(job)}
                        disabled={(job.editsUsed || 0) >= (job.maxEdits || 3)}
                        className="flex-1"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit ({(job.maxEdits || 3) - (job.editsUsed || 0)} left)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(job.id)}
                        className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Applicants Tab */}
        {activeTab === 'applicants' && (
          <div className="space-y-4 animate-slide-up">
            {applications.length === 0 ? (
              <div className="p-8 glass-card rounded-2xl text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No Applications Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Post a job to start receiving applications from candidates.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div 
                    key={app.id} 
                    className="p-4 glass-card rounded-2xl cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => setSelectedApplicant(app)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{app.candidateName}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getApplicationStatusColor(app.status)}`}>
                            {app.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{app.jobRole}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{app.candidateExperience}</span>
                          <span>•</span>
                          <span>{app.candidateLocation}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                      <span className="text-xs text-muted-foreground">
                        Applied {formatDate(app.createdAt)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <div className="space-y-4 animate-slide-up">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/30"
              />
            </div>
            
            {/* Credits Info */}
            <div className="p-4 glass-card rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium">Contact Credits</p>
                  <p className="text-xs text-muted-foreground">1 credit = 1 contact unlock</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{stats.contactCredits}</p>
                  <p className="text-xs text-muted-foreground">remaining</p>
                </div>
              </div>
              {stats.contactCredits <= 5 && (
                <Button 
                  onClick={() => setShowBuyCreditsModal(true)} 
                  className="w-full bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy More Credits
                </Button>
              )}
            </div>
            
            {candidates.length === 0 ? (
              <div className="p-8 glass-card rounded-2xl text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No Candidates Available</h3>
                <p className="text-sm text-muted-foreground">
                  Candidates will appear here once job seekers register on the platform.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCandidates.map((candidate) => {
                  const isUnlocked = user?.id ? isCandidateUnlocked(user.id, candidate.id) : false
                  return (
                    <div 
                      key={candidate.id} 
                      className="p-4 glass-card rounded-2xl"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{candidate.name}</h3>
                            {candidate.availabilityStatus === 'not_looking' && (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                                <EyeOff className="w-3 h-3" />
                                Not looking
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-primary">{candidate.role}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-secondary/80">
                              {candidate.experience}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-secondary/80">
                              {candidate.salaryExpectation}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Skills */}
                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {candidate.skills.slice(0, 4).map((skill, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.length > 4 && (
                            <span className="text-xs px-2 py-0.5 text-muted-foreground">
                              +{candidate.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Contact */}
                      <div className="mt-3 pt-3 border-t border-border/30">
                        {isUnlocked ? (
                          <a
                            href={`tel:${candidate.phone}`}
                            className="flex items-center gap-2 text-sm text-primary"
                          >
                            <Phone className="w-4 h-4" />
                            {candidate.phone}
                          </a>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              if (stats.contactCredits <= 0) {
                                setShowBuyCreditsModal(true)
                              } else {
                                handleUnlockCandidate(candidate.id)
                              }
                            }}
                            className="w-full"
                            variant={stats.contactCredits <= 0 ? "outline" : "default"}
                          >
                            {stats.contactCredits <= 0 ? (
                              <>
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Buy Credits to Unlock
                              </>
                            ) : (
                              <>
                                <Crown className="w-4 h-4 mr-2" />
                                Unlock Contact (1 credit)
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4 animate-slide-up">
            <div className="p-5 glass-card rounded-2xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Salon Profile
              </h3>
              {salonProfile ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Salon Name</span>
                    <span className="font-medium flex items-center gap-2">
                      {salonProfile.salonName}
                      {salonProfile.isVerified && (
                        <BadgeCheck className="w-4 h-4 text-blue-400" />
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Owner</span>
                    <span className="font-medium">{salonProfile.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mobile</span>
                    <span className="font-medium">{salonProfile.mobile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-right max-w-[60%]">{salonProfile.city}, {salonProfile.state}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">Profile not set up</p>
                  <Button onClick={() => goToStep('salon-profile')} size="sm">
                    Set Up Profile
                  </Button>
                </div>
              )}
            </div>
            
            {/* Verified Badge Section */}
            <div className="p-5 glass-card rounded-2xl border-2 border-blue-500/30">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-blue-400" />
                Verified Badge
              </h3>
              {salonProfile?.isVerified ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-xl">
                    <BadgeCheck className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="font-medium text-blue-400">Verified Salon</p>
                      <p className="text-xs text-muted-foreground">
                        Valid until {salonProfile.verifiedUntil ? new Date(salonProfile.verifiedUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your verified badge is visible on your profile and all job posts.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Get a verified badge to build trust with job seekers and stand out from other salons.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-blue-400" />
                    Badge visible on your profile
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-blue-400" />
                    Badge shown on all job posts
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-blue-400" />
                    Increased trust from candidates
                  </div>
                  <Button 
                    onClick={() => setShowVerifiedBadgeModal(true)} 
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Get Verified Badge
                  </Button>
                </div>
              )}
            </div>
            
            <div className="p-5 glass-card rounded-2xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Contact Credits
              </h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">Available Credits</span>
                <span className="text-2xl font-bold text-primary">{stats.contactCredits}</span>
              </div>
              <Button onClick={() => setShowBuyCreditsModal(true)} variant="outline" className="w-full">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buy More Credits
              </Button>
            </div>
            
            <Button
              onClick={logout}
              variant="outline"
              className="w-full h-12 border-red-400/30 text-red-400 hover:bg-red-400/10"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 glass-card rounded-2xl animate-scale-in">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Delete Job?</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              This action cannot be undone. The job will be permanently removed.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDeleteJob(showDeleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Applicant Detail Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full md:max-w-lg md:rounded-2xl bg-card glass-card rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Applicant Details</h2>
                <button onClick={() => setSelectedApplicant(null)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedApplicant.candidateName}</h3>
                  <p className="text-muted-foreground">{selectedApplicant.jobRole}</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Experience</span>
                  <span>{selectedApplicant.candidateExperience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span>{selectedApplicant.candidateLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getApplicationStatusColor(selectedApplicant.status)}`}>
                    {selectedApplicant.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Applied</span>
                  <span>{formatDate(selectedApplicant.createdAt)}</span>
                </div>
              </div>
              
              {selectedApplicant.candidateSkills && selectedApplicant.candidateSkills.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplicant.candidateSkills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Contact */}
              {selectedApplicant.isContactUnlocked && selectedApplicant.candidatePhone && (
                <a
                  href={`tel:${selectedApplicant.candidatePhone}`}
                  className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl mb-6"
                >
                  <Phone className="w-5 h-5 text-primary" />
                  <span className="font-medium">{selectedApplicant.candidatePhone}</span>
                </a>
              )}
              
              <Button onClick={() => setSelectedApplicant(null)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Buy Credits Modal */}
      {showBuyCreditsModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-background/90 backdrop-blur-md">
          <div className="w-full md:max-w-md md:rounded-2xl bg-card glass-card rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Buy Contact Credits</h2>
                <button onClick={() => setShowBuyCreditsModal(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Check if user has posted at least one job */}
              {ownerJobs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Post a Job First</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    You need to post at least one job before you can purchase additional contact credits. Your first job post includes 30 free credits!
                  </p>
                  <Button 
                    onClick={() => {
                      setShowBuyCreditsModal(false)
                      goToStep('create-job')
                    }}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Post Your First Job
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-6">
                    Use credits to unlock job seeker contact numbers. 1 credit = 1 contact unlock.
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    {CREDIT_PACKS.map((pack) => (
                      <div 
                        key={pack.id}
                        className={`p-4 rounded-2xl border-2 transition-colors ${
                          pack.recommended 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border/50 bg-secondary/20'
                        }`}
                      >
                        {pack.recommended && (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground mb-2">
                            Best Value
                          </span>
                        )}
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{pack.name}</h3>
                            <p className="text-sm text-muted-foreground">{pack.credits} credits</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">Rs.{pack.price}</p>
                            <p className="text-xs text-muted-foreground">
                              Rs.{(pack.price / pack.credits).toFixed(0)}/credit
                            </p>
                          </div>
                        </div>
                        <ul className="space-y-1 mb-4">
                          {pack.features.slice(0, 3).map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Check className="w-3 h-3 text-primary" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button 
                          onClick={() => {
                            setShowBuyCreditsModal(false)
                            // Navigate to payment with pack info
                            goToStep('credit-payment')
                            // Store selected pack in localStorage for payment screen
                            localStorage.setItem('salonjobsindia_selected_credit_pack', JSON.stringify(pack))
                          }}
                          className={`w-full ${pack.recommended ? 'bg-primary hover:bg-primary/90' : ''}`}
                          variant={pack.recommended ? 'default' : 'outline'}
                        >
                          Buy {pack.credits} Credits
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Credits never expire and are added instantly after payment approval.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verified Badge Modal */}
      {showVerifiedBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-background/90 backdrop-blur-md">
          <div className="w-full md:max-w-md md:rounded-2xl bg-card glass-card rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Get Verified Badge</h2>
                <button onClick={() => setShowVerifiedBadgeModal(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <BadgeCheck className="w-10 h-10 text-blue-400" />
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground text-center mb-6">
                A verified badge shows job seekers that your salon is trustworthy and legitimate.
              </p>
              
              <div className="space-y-4 mb-6">
                {VERIFIED_BADGE_PLANS.map((plan) => (
                  <div 
                    key={plan.id}
                    className={`p-4 rounded-2xl border-2 transition-colors ${
                      plan.recommended 
                        ? 'border-blue-500 bg-blue-500/5' 
                        : 'border-border/50 bg-secondary/20'
                    }`}
                  >
                    {plan.recommended && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500 text-white">
                          Best Value
                        </span>
                        {plan.savings && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                            {plan.savings}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.durationMonths} month{plan.durationMonths > 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-400">Rs.{plan.price}</p>
                        <p className="text-xs text-muted-foreground">
                          Rs.{Math.round(plan.price / plan.durationMonths)}/month
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-1 mb-4">
                      {plan.features.slice(0, 4).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="w-3 h-3 text-blue-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      onClick={() => {
                        setShowVerifiedBadgeModal(false)
                        // Navigate to verified badge payment
                        goToStep('credit-payment')
                        // Store selected plan in localStorage for payment screen
                        localStorage.setItem('salonjobsindia_selected_credit_pack', JSON.stringify({
                          ...plan,
                          type: 'verified_badge',
                          credits: 0
                        }))
                      }}
                      className={`w-full ${plan.recommended ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                      variant={plan.recommended ? 'default' : 'outline'}
                    >
                      Get {plan.durationMonths} Month{plan.durationMonths > 1 ? 's' : ''} Badge
                    </Button>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-center text-muted-foreground">
                Badge activates instantly after payment approval by admin.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
