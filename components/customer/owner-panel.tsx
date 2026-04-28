'use client'

import { useState, useEffect } from 'react'
import { Plus, Briefcase, Users, Settings, LogOut, Edit2, Trash2, Eye, ChevronRight, Building2, MapPin, DollarSign, Clock, Crown, User, Search, Filter, TrendingUp, UserCheck, Bell, BarChart3, MessageCircle, Phone, AlertCircle, Check, X, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/lib/app-context'
import { getMessagesForOwner, getAllJobs, getUnreadMessageCount } from '@/lib/data-store'
import type { BeautyRole } from '@/lib/types'
import { BEAUTY_ROLES } from '@/lib/types'

type TabType = 'dashboard' | 'jobs' | 'applicants' | 'candidates' | 'settings'

interface MockJob {
  id: string
  title: string
  salary: { min: number; max: number }
  experience: string
  applicationsCount: number
  viewsCount: number
  isActive: boolean
  createdAt: Date
  status?: 'draft' | 'payment_pending' | 'pending_approval' | 'approved' | 'live' | 'rejected'
}

interface PendingJob {
  id: string
  salonName: string
  salonMobile: string
  role: string
  customRole: string
  salary: string
  experience: string
  description: string
  location: {
    lat: number
    lng: number
    address: string
  }
  status: 'draft' | 'payment_pending' | 'pending_approval' | 'approved' | 'live' | 'rejected'
  paymentScreenshot?: string
  createdAt: Date
}

interface MockApplicant {
  id: string
  name: string
  role: BeautyRole
  experience: string
  phone: string
  location: string
  appliedFor: string
  status: 'pending' | 'shortlisted' | 'interviewed' | 'hired' | 'rejected'
  appliedAt: Date
  skills: string[]
}

interface MockCandidate {
  id: string
  name: string
  role: BeautyRole
  experience: string
  salary: string
  location: string
  skills: string[]
  rating: number
}

// Mock data for candidates
const MOCK_CANDIDATES: MockCandidate[] = [
  { id: 'c1', name: 'Priya Sharma', role: 'Hair Stylist', experience: '3 years', salary: 'Rs.25-30K', location: 'Koramangala', skills: ['Hair Cutting', 'Coloring', 'Styling'], rating: 4.8 },
  { id: 'c2', name: 'Anjali Verma', role: 'Makeup Artist', experience: '5 years', salary: 'Rs.35-45K', location: 'Indiranagar', skills: ['Bridal Makeup', 'Party Makeup', 'HD Makeup'], rating: 4.9 },
  { id: 'c3', name: 'Rahul Singh', role: 'Barber', experience: '4 years', salary: 'Rs.20-25K', location: 'HSR Layout', skills: ['Hair Cutting', 'Beard Styling', 'Head Massage'], rating: 4.6 },
  { id: 'c4', name: 'Sneha Patel', role: 'Nail Technician', experience: '2 years', salary: 'Rs.18-22K', location: 'Whitefield', skills: ['Manicure', 'Pedicure', 'Nail Art'], rating: 4.7 },
  { id: 'c5', name: 'Kavita Joshi', role: 'Spa Therapist', experience: '6 years', salary: 'Rs.28-35K', location: 'JP Nagar', skills: ['Body Massage', 'Facial', 'Aromatherapy'], rating: 4.8 },
  { id: 'c6', name: 'Deepa Nair', role: 'Beautician', experience: '4 years', salary: 'Rs.22-28K', location: 'BTM Layout', skills: ['Facial', 'Threading', 'Waxing', 'Bleach'], rating: 4.5 },
  { id: 'c7', name: 'Meera Krishnan', role: 'Bridal Makeup Artist', experience: '8 years', salary: 'Rs.50-70K', location: 'Jayanagar', skills: ['Bridal Makeup', 'Saree Draping', 'Hair Styling'], rating: 5.0 },
  { id: 'c8', name: 'Ravi Kumar', role: 'Hair Colorist', experience: '5 years', salary: 'Rs.30-40K', location: 'Marathahalli', skills: ['Global Color', 'Balayage', 'Highlights'], rating: 4.7 },
]

// Mock applicants
const MOCK_APPLICANTS: MockApplicant[] = [
  { id: 'a1', name: 'Priya Sharma', role: 'Hair Stylist', experience: '3 years', phone: '9876543210', location: 'Koramangala', appliedFor: 'Senior Hair Stylist', status: 'pending', appliedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), skills: ['Hair Cutting', 'Coloring'] },
  { id: 'a2', name: 'Rahul Verma', role: 'Hair Stylist', experience: '2 years', phone: '9876543211', location: 'Indiranagar', appliedFor: 'Senior Hair Stylist', status: 'shortlisted', appliedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), skills: ['Styling', 'Hair Treatment'] },
  { id: 'a3', name: 'Anita Patel', role: 'Makeup Artist', experience: '4 years', phone: '9876543212', location: 'HSR Layout', appliedFor: 'Makeup Artist', status: 'interviewed', appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), skills: ['Bridal', 'Party Makeup'] },
]

export function OwnerPanel() {
  const { user, logout, goToStep } = useApp()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All')
  const [selectedApplicant, setSelectedApplicant] = useState<MockApplicant | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<MockCandidate | null>(null)
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([])
  
  // State
  const [ownerJobs, setOwnerJobs] = useState<MockJob[]>([
    { id: '1', title: 'Senior Hair Stylist', salary: { min: 25000, max: 35000 }, experience: '2-5 years', applicationsCount: 12, viewsCount: 45, isActive: true, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { id: '2', title: 'Makeup Artist', salary: { min: 20000, max: 30000 }, experience: '1-3 years', applicationsCount: 8, viewsCount: 32, isActive: true, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
  ])
  const [applicants] = useState<MockApplicant[]>(MOCK_APPLICANTS)
  const [candidates] = useState<MockCandidate[]>(MOCK_CANDIDATES)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Load data
  useEffect(() => {
    if (user?.id) {
      // Get custom jobs
      const jobs = getAllJobs().filter(j => j.salonId === user.id || !j.salonId)
      if (jobs.length > 0) {
        setOwnerJobs(prev => [
          ...prev,
          ...jobs.map(j => ({
            id: j.id,
            title: j.role,
            salary: { min: parseInt(j.salary.replace(/[^\d]/g, '')) || 20000, max: parseInt(j.salary.split('-')[1]?.replace(/[^\d]/g, '')) || 30000 },
            experience: j.experience,
            applicationsCount: j.applicationsCount || 0,
            viewsCount: 0,
            isActive: j.isActive,
            createdAt: new Date(j.createdAt),
          }))
        ])
      }
      
      // Get unread messages
      setUnreadMessages(getUnreadMessageCount(user.id))
      
      // Load pending jobs
      const stored = localStorage.getItem(`fitone_pending_jobs_${user.id}`)
      if (stored) {
        setPendingJobs(JSON.parse(stored))
      }
    }
  }, [user?.id])
  
  // Poll for status updates on pending jobs
  useEffect(() => {
    if (!user?.id) return
    
    const interval = setInterval(() => {
      const stored = localStorage.getItem(`fitone_pending_jobs_${user.id}`)
      if (stored) {
        setPendingJobs(JSON.parse(stored))
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [user?.id])
  
  const handlePublishJob = (pendingJob: PendingJob) => {
    // Add to owner jobs as live
    const newJob: MockJob = {
      id: pendingJob.id,
      title: pendingJob.role || pendingJob.customRole,
      salary: { min: parseInt(pendingJob.salary.replace(/[^\d]/g, '')) || 20000, max: 30000 },
      experience: pendingJob.experience,
      applicationsCount: 0,
      viewsCount: 0,
      isActive: true,
      createdAt: new Date(),
      status: 'live'
    }
    setOwnerJobs(prev => [newJob, ...prev])
    
    // Update pending job status
    const updatedPending = pendingJobs.map(j => 
      j.id === pendingJob.id ? { ...j, status: 'live' as const } : j
    )
    setPendingJobs(updatedPending)
    localStorage.setItem(`fitone_pending_jobs_${user?.id}`, JSON.stringify(updatedPending))
  }
  
  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-secondary text-muted-foreground'
      case 'payment_pending': return 'bg-amber-500/20 text-amber-400'
      case 'pending_approval': return 'bg-blue-500/20 text-blue-400'
      case 'approved': return 'bg-green-500/20 text-green-400'
      case 'live': return 'bg-primary/20 text-primary'
      case 'rejected': return 'bg-red-500/20 text-red-400'
      default: return 'bg-secondary text-muted-foreground'
    }
  }
  
  const getJobStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft'
      case 'payment_pending': return 'Payment Pending'
      case 'pending_approval': return 'Under Review'
      case 'approved': return 'Ready to Publish'
      case 'live': return 'Live'
      case 'rejected': return 'Rejected'
      default: return status
    }
  }

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = !searchQuery || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRoleFilter === 'All' || c.role === selectedRoleFilter
    return matchesSearch && matchesRole
  })

  const platformStats = {
    totalCandidates: 2847,
    totalJobs: 156,
    totalHires: 89,
    newToday: 24,
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'applicants', label: 'Applicants', icon: Users },
    { id: 'candidates', label: 'Find Talent', icon: UserCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const formatDate = (date: Date) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days}d ago`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-400'
      case 'shortlisted': return 'bg-primary/20 text-primary'
      case 'interviewed': return 'bg-blue-500/20 text-blue-400'
      case 'hired': return 'bg-green-500/20 text-green-400'
      case 'rejected': return 'bg-red-500/20 text-red-400'
      default: return 'bg-secondary text-muted-foreground'
    }
  }

  const handleDeleteJob = (jobId: string) => {
    setOwnerJobs(prev => prev.filter(j => j.id !== jobId))
    setShowDeleteConfirm(null)
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
              <h1 className="font-bold">Salon Dashboard</h1>
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
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">3</span>
            </button>
          </div>
        </div>
        
        {/* Platform Stats Banner */}
        <div className="p-4 glass-card rounded-xl bg-gradient-to-r from-primary/20 to-accent/10 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Registered Candidates</p>
              <p className="text-3xl font-bold text-primary">{platformStats.totalCandidates.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-green-400 flex items-center gap-1 justify-end">
                <TrendingUp className="w-3 h-3" /> +{platformStats.newToday} today
              </p>
              <p className="text-sm text-muted-foreground">Active job seekers</p>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-3 glass-card rounded-xl text-center">
            <p className="text-xl font-bold text-primary">{ownerJobs.length}</p>
            <p className="text-[10px] text-muted-foreground">My Jobs</p>
          </div>
          <div className="p-3 glass-card rounded-xl text-center">
            <p className="text-xl font-bold text-accent">{applicants.length}</p>
            <p className="text-[10px] text-muted-foreground">Applicants</p>
          </div>
          <div className="p-3 glass-card rounded-xl text-center">
            <p className="text-xl font-bold text-green-400">{applicants.filter(a => a.status === 'hired').length}</p>
            <p className="text-[10px] text-muted-foreground">Hired</p>
          </div>
          <div className="p-3 glass-card rounded-xl text-center">
            <p className="text-xl font-bold text-foreground">{ownerJobs.reduce((sum, j) => sum + j.viewsCount, 0)}</p>
            <p className="text-[10px] text-muted-foreground">Views</p>
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
            {/* Recent Activity */}
            <div className="p-5 glass-card rounded-2xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {applicants.slice(0, 3).map((app) => (
                  <div key={app.id} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{app.name} applied</p>
                      <p className="text-xs text-muted-foreground">for {app.appliedFor}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(app.appliedAt)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => goToStep('create-job')} className="h-14 bg-primary hover:bg-primary/90">
                <Plus className="w-5 h-5 mr-2" />
                Post Job
              </Button>
              <Button onClick={() => setActiveTab('candidates')} variant="outline" className="h-14 border-primary/50 text-primary">
                <Search className="w-5 h-5 mr-2" />
                Find Talent
              </Button>
            </div>
            
            {/* Subscription CTA */}
            <div className="p-5 glass-card rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-3 mb-3">
                <Crown className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Upgrade Your Plan</h3>
                  <p className="text-xs text-muted-foreground">Post more jobs and reach more candidates</p>
                </div>
              </div>
              <Button onClick={() => goToStep('subscription')} className="w-full h-12 bg-primary/90 hover:bg-primary">
                View Plans
              </Button>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-4 animate-slide-up">
            <Button onClick={() => goToStep('create-job')} className="w-full h-14 bg-primary hover:bg-primary/90 gold-glow">
              <Plus className="w-5 h-5 mr-2" />
              Post New Job (Rs.149)
            </Button>
            
            {/* Pending Jobs Section */}
            {pendingJobs.filter(j => j.status !== 'live').length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Pending Jobs</h3>
                {pendingJobs.filter(j => j.status !== 'live').map((job) => (
                  <div key={job.id} className="p-4 glass-card rounded-2xl border border-border/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{job.role || job.customRole}</h3>
                        <p className="text-sm text-muted-foreground">{job.salonName}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getJobStatusColor(job.status)}`}>
                        {getJobStatusLabel(job.status)}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                        <DollarSign className="w-3 h-3" />
                        {job.salary}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-secondary/80 text-foreground">
                        <MapPin className="w-3 h-3" />
                        {job.location.address?.split(',')[0] || 'Location'}
                      </span>
                    </div>
                    
                    {/* Status-specific content */}
                    {job.status === 'pending_approval' && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <p className="text-xs text-blue-400">Payment under review. We&apos;ll notify you once approved.</p>
                      </div>
                    )}
                    
                    {job.status === 'approved' && (
                      <div className="space-y-2">
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-400" />
                          <p className="text-xs text-green-400">Payment approved! Your job is ready to go live.</p>
                        </div>
                        <Button 
                          onClick={() => handlePublishJob(job)}
                          className="w-full h-10 bg-green-600 hover:bg-green-700"
                        >
                          <Rocket className="w-4 h-4 mr-2" />
                          Publish Job Now
                        </Button>
                      </div>
                    )}
                    
                    {job.status === 'rejected' && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <p className="text-xs text-red-400">Payment rejected. Please contact support or try again.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Live Jobs Section */}
            {ownerJobs.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Live Jobs</h3>
                {ownerJobs.map((job) => (
                  <div key={job.id} className="p-5 glass-card rounded-2xl">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">{formatDate(job.createdAt)}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        job.isActive ? 'bg-green-500/20 text-green-400' : 'bg-secondary text-muted-foreground'
                      }`}>
                        {job.isActive ? 'Live' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-primary/10 text-primary">
                        <DollarSign className="w-3 h-3" />
                        Rs.{job.salary.min.toLocaleString()} - Rs.{job.salary.max.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-secondary/80 text-foreground">
                        <Clock className="w-3 h-3" />
                        {job.experience}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-border/30">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {job.viewsCount} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {job.applicationsCount} applicants
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-secondary/50 rounded-lg">
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button onClick={() => setShowDeleteConfirm(job.id)} className="p-2 hover:bg-destructive/10 rounded-lg">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {ownerJobs.length === 0 && pendingJobs.filter(j => j.status !== 'live').length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No jobs posted yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Post your first job to start receiving applications</p>
                <Button onClick={() => goToStep('create-job')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Post Job
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Applicants Tab */}
        {activeTab === 'applicants' && (
          <div className="space-y-3 animate-slide-up">
            {applicants.map((applicant) => (
              <button
                key={applicant.id}
                onClick={() => setSelectedApplicant(applicant)}
                className="w-full p-4 glass-card rounded-xl text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{applicant.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {applicant.appliedFor} | {formatDate(applicant.appliedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(applicant.status)}`}>
                      {applicant.status}
                    </span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </button>
            ))}
            
            {applicants.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No applicants yet</h3>
                <p className="text-sm text-muted-foreground">Post a job to start receiving applications</p>
              </div>
            )}
          </div>
        )}

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <div className="space-y-4 animate-slide-up">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, role, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-secondary/50"
                />
              </div>
            </div>
            
            {/* Role Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['All', 'Hair Stylist', 'Makeup Artist', 'Barber', 'Nail Technician', 'Spa Therapist', 'Beautician'].map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRoleFilter(role)}
                  className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-all ${
                    selectedRoleFilter === role
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Showing {filteredCandidates.length} of {platformStats.totalCandidates.toLocaleString()} candidates
            </p>

            {/* Candidates List */}
            {filteredCandidates.map((candidate) => (
              <button
                key={candidate.id}
                onClick={() => setSelectedCandidate(candidate)}
                className="w-full p-4 glass-card rounded-xl text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-secondary/80 flex items-center justify-center">
                    <User className="w-7 h-7 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{candidate.name}</h4>
                      <div className="flex items-center gap-1 text-amber-500">
                        <span className="text-sm font-medium">{candidate.rating}</span>
                        <span className="text-xs">★</span>
                      </div>
                    </div>
                    <p className="text-sm text-primary">{candidate.role}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{candidate.experience}</span>
                      <span>|</span>
                      <span>{candidate.salary}</span>
                      <span>|</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {candidate.location}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {candidate.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="px-2 py-0.5 text-[10px] rounded-full bg-secondary/50">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4 animate-slide-up">
            <div className="p-5 glass-card rounded-2xl">
              <h3 className="font-semibold mb-4">Account Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <span>Edit Profile</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <span>Notifications</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-muted-foreground" />
                    <span>Subscription</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </div>
            
            <Button
              onClick={logout}
              variant="outline"
              className="w-full h-12 border-destructive/50 text-destructive hover:bg-destructive/10"
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
            <h3 className="text-lg font-bold mb-2">Delete Job?</h3>
            <p className="text-muted-foreground mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)} className="flex-1 h-12">
                Cancel
              </Button>
              <Button onClick={() => handleDeleteJob(showDeleteConfirm)} className="flex-1 h-12 bg-destructive hover:bg-destructive/90">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Applicant Details Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 glass-card rounded-t-3xl animate-slide-up max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setSelectedApplicant(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4 rotate-90" />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedApplicant.name}</h2>
                <p className="text-primary">{selectedApplicant.role}</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-secondary/30 rounded-xl">
                  <p className="text-xs text-muted-foreground">Experience</p>
                  <p className="font-semibold">{selectedApplicant.experience}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-semibold">{selectedApplicant.location}</p>
                </div>
              </div>
              
              <div className="p-3 bg-secondary/30 rounded-xl">
                <p className="text-xs text-muted-foreground mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedApplicant.skills.map(skill => (
                    <span key={skill} className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="p-3 bg-primary/10 rounded-xl border border-primary/30">
                <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
                <p className="font-bold text-lg">+91 {selectedApplicant.phone}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => window.open(`tel:+91${selectedApplicant.phone}`, '_self')}
                className="flex-1 h-12"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call
              </Button>
              <Button
                onClick={() => window.open(`https://wa.me/91${selectedApplicant.phone}`, '_blank')}
                className="flex-1 h-12 bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Candidate Details Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 glass-card rounded-t-3xl animate-slide-up max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCandidate(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4 rotate-90" />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-secondary/80 flex items-center justify-center">
                <User className="w-8 h-8 text-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedCandidate.name}</h2>
                <p className="text-primary">{selectedCandidate.role}</p>
                <div className="flex items-center gap-1 text-amber-500 mt-1">
                  <span className="font-medium">{selectedCandidate.rating}</span>
                  <span>★</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-secondary/30 rounded-xl">
                  <p className="text-xs text-muted-foreground">Experience</p>
                  <p className="font-semibold">{selectedCandidate.experience}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl">
                  <p className="text-xs text-muted-foreground">Expected Salary</p>
                  <p className="font-semibold">{selectedCandidate.salary}</p>
                </div>
              </div>
              
              <div className="p-3 bg-secondary/30 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Location</p>
                <p className="font-semibold flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {selectedCandidate.location}
                </p>
              </div>
              
              <div className="p-3 bg-secondary/30 rounded-xl">
                <p className="text-xs text-muted-foreground mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map(skill => (
                    <span key={skill} className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <Button onClick={() => goToStep('subscription')} className="w-full h-12 bg-primary hover:bg-primary/90">
              <Crown className="w-5 h-5 mr-2" />
              Unlock Contact Details
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Subscribe to view candidate contact information
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
