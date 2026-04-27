'use client'

import { useState, useEffect } from 'react'
import { Plus, Briefcase, Users, Settings, LogOut, Edit2, Trash2, Eye, ChevronRight, Building2, MapPin, DollarSign, Clock, Crown, User, Search, Filter, TrendingUp, UserCheck, Bell, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/lib/app-context'
import { DatabaseService, type JobSeeker, type Application } from '@/lib/firebase'

const MAX_FREE_JOBS = 5

type TabType = 'dashboard' | 'jobs' | 'applicants' | 'candidates' | 'settings'

export function OwnerPanel() {
  const { user, logout, goToStep } = useApp()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  // Database state
  const [platformStats, setPlatformStats] = useState({
    totalJobSeekers: 0,
    totalSalonOwners: 0,
    totalJobs: 0,
    totalApplications: 0,
    totalHires: 0,
  })
  const [ownerJobs, setOwnerJobs] = useState<any[]>([])
  const [applicants, setApplicants] = useState<Application[]>([])
  const [candidates, setCandidates] = useState<JobSeeker[]>([])
  const [candidatesPage, setCandidatesPage] = useState(1)
  const [hasMoreCandidates, setHasMoreCandidates] = useState(true)

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // Load platform stats
        const stats = await DatabaseService.getPlatformStats()
        setPlatformStats(stats)

        // Load owner's jobs
        if (user?.id) {
          const jobs = await DatabaseService.getJobsByOwner(user.id)
          setOwnerJobs(jobs.length > 0 ? jobs : [
            {
              id: '1',
              title: 'Senior Hair Stylist',
              salary: { min: 25000, max: 35000 },
              experience: '2-5 years',
              applicationsCount: 12,
              viewsCount: 45,
              isActive: true,
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            },
            {
              id: '2',
              title: 'Makeup Artist',
              salary: { min: 20000, max: 30000 },
              experience: '1-3 years',
              applicationsCount: 8,
              viewsCount: 32,
              isActive: true,
              createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            },
          ])

          // Load applications
          const apps = await DatabaseService.getApplicationsByOwner(user.id)
          setApplicants(apps.length > 0 ? apps : [
            { id: 'a1', seekerName: 'Priya Sharma', jobTitle: 'Hair Stylist', status: 'pending', appliedAt: new Date() } as any,
            { id: 'a2', seekerName: 'Rahul Verma', jobTitle: 'Hair Stylist', status: 'shortlisted', appliedAt: new Date() } as any,
            { id: 'a3', seekerName: 'Anita Patel', jobTitle: 'Makeup Artist', status: 'interviewed', appliedAt: new Date() } as any,
          ])
        }

        // Load candidates
        const { seekers, hasMore } = await DatabaseService.getJobSeekers({}, 1, 20)
        setCandidates(seekers)
        setHasMoreCandidates(hasMore)
      } catch (error) {
        console.error('Error loading data:', error)
      }
      setIsLoading(false)
    }

    loadData()
  }, [user?.id])

  // Load more candidates
  const loadMoreCandidates = async () => {
    const nextPage = candidatesPage + 1
    const { seekers, hasMore } = await DatabaseService.getJobSeekers(
      { searchQuery: searchQuery || undefined },
      nextPage,
      20
    )
    setCandidates(prev => [...prev, ...seekers])
    setCandidatesPage(nextPage)
    setHasMoreCandidates(hasMore)
  }

  // Search candidates
  const searchCandidates = async () => {
    setIsLoading(true)
    const { seekers, hasMore } = await DatabaseService.getJobSeekers(
      { searchQuery: searchQuery || undefined },
      1,
      20
    )
    setCandidates(seekers)
    setCandidatesPage(1)
    setHasMoreCandidates(hasMore)
    setIsLoading(false)
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'applicants', label: 'Applicants', icon: Users },
    { id: 'candidates', label: 'Candidates', icon: UserCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const formatDate = (date: Date) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  const formatNumber = (num: number) => {
    if (num >= 100000) {
      return `${(num / 100000).toFixed(2)} Lakh`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
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

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
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
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">3</span>
            </button>
            <button 
              onClick={() => goToStep('role')}
              className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center"
            >
              <User className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
        
        {/* Platform Stats Banner */}
        <div className="p-4 glass-card rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Registered Candidates</p>
              <p className="text-3xl font-bold text-primary">{formatNumber(platformStats.totalJobSeekers)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-green-400 flex items-center gap-1 justify-end">
                <TrendingUp className="w-3 h-3" /> +2.4K today
              </p>
              <p className="text-sm text-muted-foreground">Active job seekers</p>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-3 glass-card rounded-xl text-center">
            <p className="text-xl font-bold text-primary">{ownerJobs.length}</p>
            <p className="text-[10px] text-muted-foreground">Jobs</p>
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
            <p className="text-xl font-bold text-foreground">{ownerJobs.reduce((sum, j) => sum + (j.viewsCount || 0), 0)}</p>
            <p className="text-[10px] text-muted-foreground">Views</p>
          </div>
        </div>
      </header>
      
      {/* Tabs */}
      <div className="relative z-10 px-4 py-3">
        <div className="flex gap-1 p-1 bg-secondary/30 rounded-xl overflow-x-auto">
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
            {/* Platform Overview */}
            <div className="p-5 glass-card rounded-2xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Platform Overview
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-secondary/30 rounded-xl">
                  <p className="text-2xl font-bold">{formatNumber(platformStats.totalJobSeekers)}</p>
                  <p className="text-xs text-muted-foreground">Total Candidates</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl">
                  <p className="text-2xl font-bold">{formatNumber(platformStats.totalSalonOwners)}</p>
                  <p className="text-xs text-muted-foreground">Salon Owners</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl">
                  <p className="text-2xl font-bold">{formatNumber(platformStats.totalJobs)}</p>
                  <p className="text-xs text-muted-foreground">Active Jobs</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl">
                  <p className="text-2xl font-bold">{formatNumber(platformStats.totalHires)}</p>
                  <p className="text-xs text-muted-foreground">Successful Hires</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-5 glass-card rounded-2xl">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New application received</p>
                    <p className="text-xs text-muted-foreground">Priya Sharma applied for Hair Stylist</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2h ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Job views increased</p>
                    <p className="text-xs text-muted-foreground">Senior Hair Stylist got 15 new views</p>
                  </div>
                  <span className="text-xs text-muted-foreground">5h ago</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => goToStep('create-job')}
                className="h-14 bg-primary hover:bg-primary/90"
              >
                <Plus className="w-5 h-5 mr-2" />
                Post Job
              </Button>
              <Button
                onClick={() => setActiveTab('candidates')}
                variant="outline"
                className="h-14 border-primary/50 text-primary"
              >
                <Search className="w-5 h-5 mr-2" />
                Find Candidates
              </Button>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-4 animate-slide-up">
            {/* Add Job Button */}
            <Button
              onClick={() => goToStep('create-job')}
              className="w-full h-14 bg-primary hover:bg-primary/90 gold-glow"
            >
              <Plus className="w-5 h-5 mr-2" />
              Post New Job
            </Button>
            
            {/* Jobs List */}
            {ownerJobs.map((job) => (
              <div
                key={job.id}
                className="p-5 glass-card rounded-2xl"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(job.createdAt)}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    job.isActive ? 'bg-green-500/20 text-green-400' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {job.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-primary/10 text-primary">
                    <DollarSign className="w-3 h-3" />
                    ₹{job.salary?.min?.toLocaleString()} - ₹{job.salary?.max?.toLocaleString()}
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
                      {job.viewsCount || 0} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {job.applicationsCount || 0} applicants
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-secondary/50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(job.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Applicants Tab */}
        {activeTab === 'applicants' && (
          <div className="space-y-3 animate-slide-up">
            {applicants.map((applicant) => (
              <div
                key={applicant.id}
                className="p-4 glass-card rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary/80 flex items-center justify-center">
                      <User className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{applicant.seekerName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {applicant.jobTitle} · {formatDate(applicant.appliedAt)}
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
              </div>
            ))}
            
            {applicants.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No applicants yet</h3>
                <p className="text-sm text-muted-foreground">Applicants will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Candidates Tab - Browse all registered candidates */}
        {activeTab === 'candidates' && (
          <div className="space-y-4 animate-slide-up">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search candidates by name, role, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchCandidates()}
                  className="pl-10 h-12 bg-secondary/50"
                />
              </div>
              <Button onClick={searchCandidates} className="h-12 px-4">
                <Filter className="w-5 h-5" />
              </Button>
            </div>

            {/* Candidates Count */}
            <div className="flex items-center justify-between px-1">
              <p className="text-sm text-muted-foreground">
                Showing from <span className="text-primary font-semibold">{formatNumber(platformStats.totalJobSeekers)}</span> candidates
              </p>
            </div>

            {/* Candidates List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="p-4 glass-card rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-full bg-secondary/80 flex items-center justify-center flex-shrink-0">
                        <User className="w-7 h-7 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold truncate">{candidate.name}</h4>
                          {candidate.isVerified && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded">Verified</span>
                          )}
                          {candidate.isPremium && (
                            <Crown className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-primary font-medium">{candidate.role}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {candidate.experience}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {candidate.location.address}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {candidate.skills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="px-2 py-0.5 text-[10px] bg-secondary/80 rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="flex-shrink-0 text-xs border-primary/50 text-primary">
                        Contact
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Load More */}
                {hasMoreCandidates && (
                  <Button
                    onClick={loadMoreCandidates}
                    variant="outline"
                    className="w-full h-12"
                  >
                    Load More Candidates
                  </Button>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4 animate-slide-up">
            {/* Subscription Status */}
            <div className="p-5 glass-card rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Premium Plan</h3>
                  <p className="text-sm text-muted-foreground">Unlimited job postings</p>
                </div>
              </div>
              <Button
                onClick={() => goToStep('subscription')}
                variant="outline"
                className="w-full h-12 border-primary/50 text-primary hover:bg-primary/10"
              >
                Manage Subscription
              </Button>
            </div>
            
            {/* Settings Menu */}
            <div className="space-y-2">
              <button className="w-full p-4 glass-card rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Salon Profile</p>
                    <p className="text-xs text-muted-foreground">Edit salon details</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              
              <button className="w-full p-4 glass-card rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Location Settings</p>
                    <p className="text-xs text-muted-foreground">Update salon location</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              
              <button
                onClick={logout}
                className="w-full p-4 glass-card rounded-xl flex items-center justify-between text-destructive"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Log Out</p>
                    <p className="text-xs text-destructive/70">Sign out of your account</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 glass-card rounded-2xl animate-scale-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-destructive" />
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
                  onClick={() => {
                    DatabaseService.deleteJob(showDeleteConfirm)
                    setOwnerJobs(prev => prev.filter(j => j.id !== showDeleteConfirm))
                    setShowDeleteConfirm(null)
                  }}
                  className="flex-1 h-12 bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
