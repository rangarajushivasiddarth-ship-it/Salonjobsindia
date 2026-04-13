'use client'

import { useState } from 'react'
import { Plus, Briefcase, Users, Settings, LogOut, Edit2, Trash2, Eye, ChevronRight, Building2, MapPin, DollarSign, Clock, Crown, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'

// Mock jobs data for owner
const MOCK_OWNER_JOBS = [
  {
    id: '1',
    role: 'Senior Hair Stylist',
    salary: '₹25,000 - ₹35,000',
    experience: '2-5 years',
    applicants: 12,
    views: 45,
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    role: 'Makeup Artist',
    salary: '₹20,000 - ₹30,000',
    experience: '1-3 years',
    applicants: 8,
    views: 32,
    isActive: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    role: 'Receptionist',
    salary: '₹12,000 - ₹18,000',
    experience: 'Fresher',
    applicants: 25,
    views: 78,
    isActive: false,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  },
]

// Mock applicants data
const MOCK_APPLICANTS = [
  { id: 'a1', name: 'Priya Sharma', role: 'Hair Stylist', experience: '3 years', status: 'new' },
  { id: 'a2', name: 'Rahul Verma', role: 'Hair Stylist', experience: '5 years', status: 'viewed' },
  { id: 'a3', name: 'Anita Patel', role: 'Makeup Artist', experience: '2 years', status: 'contacted' },
  { id: 'a4', name: 'Deepa Singh', role: 'Hair Stylist', experience: '1 year', status: 'new' },
]

type TabType = 'jobs' | 'applicants' | 'settings'

export function OwnerPanel() {
  const { user, logout, goToStep } = useApp()
  const [activeTab, setActiveTab] = useState<TabType>('jobs')
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const tabs = [
    { id: 'jobs', label: 'My Jobs', icon: Briefcase },
    { id: 'applicants', label: 'Applicants', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const formatDate = (date: Date) => {
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-primary/20 text-primary'
      case 'viewed': return 'bg-accent/20 text-accent'
      case 'contacted': return 'bg-green-500/20 text-green-400'
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
          <button 
            onClick={() => goToStep('role')}
            className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center"
          >
            <User className="w-5 h-5 text-foreground" />
          </button>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 glass-card rounded-xl text-center">
            <p className="text-2xl font-bold text-primary">{MOCK_OWNER_JOBS.length}</p>
            <p className="text-xs text-muted-foreground">Active Jobs</p>
          </div>
          <div className="p-3 glass-card rounded-xl text-center">
            <p className="text-2xl font-bold text-accent">{MOCK_APPLICANTS.length}</p>
            <p className="text-xs text-muted-foreground">Applicants</p>
          </div>
          <div className="p-3 glass-card rounded-xl text-center">
            <p className="text-2xl font-bold text-foreground">155</p>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </div>
        </div>
      </header>
      
      {/* Tabs */}
      <div className="relative z-10 px-4 py-4">
        <div className="flex gap-2 p-1 bg-secondary/30 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
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
            {MOCK_OWNER_JOBS.map((job) => (
              <div
                key={job.id}
                className="p-5 glass-card rounded-2xl"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{job.role}</h3>
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
                    {job.salary}
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
                      {job.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {job.applicants} applicants
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
        
        {activeTab === 'applicants' && (
          <div className="space-y-3 animate-slide-up">
            {MOCK_APPLICANTS.map((applicant) => (
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
                      <h4 className="font-semibold">{applicant.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {applicant.role} · {applicant.experience}
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
            
            {MOCK_APPLICANTS.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No applicants yet</h3>
                <p className="text-sm text-muted-foreground">Applicants will appear here</p>
              </div>
            )}
          </div>
        )}
        
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
                  onClick={() => setShowDeleteConfirm(null)}
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
