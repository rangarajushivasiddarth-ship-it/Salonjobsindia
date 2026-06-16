'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, User, Crown, Calendar, Heart, Briefcase, LogOut, ChevronRight, MapPin, Building2, Settings, Bell, Shield, TrendingUp, Eye, Clock, Download, FileText, Search as SearchIcon, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'
import { getJobSeekerByUserId, updateJobSeekerPreference, getAllJobs, getApplicationsByCandidateId, type JobSeeker } from '@/lib/data-store'
import type { Application, Job } from '@/lib/types'
import { BrandingBanner } from './branding-banner'
import { useTranslation } from '@/lib/use-translation'
import { useLanguage } from '@/lib/language-context'

type TabType = 'overview' | 'saved' | 'applied'

export function ProfileDashboard() {
  const { user, subscription, savedJobs, appliedJobs, goToStep, logout, resume } = useApp()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isDownloading, setIsDownloading] = useState(false)
  const [jobPreference, setJobPreference] = useState<'looking_for_work' | 'not_looking_for_job'>('looking_for_work')
  const [isUpdatingPreference, setIsUpdatingPreference] = useState(false)
  const [jobSeeker, setJobSeeker] = useState<JobSeeker | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const { t } = useTranslation()
  const { currentLanguage } = useLanguage()

  // Load job seeker data and applications
  const loadData = useCallback(() => {
    if (!user?.id) return
    
    // Get job seeker profile
    const seekerProfile = getJobSeekerByUserId(user.id)
    if (seekerProfile) {
      setJobSeeker(seekerProfile)
      setJobPreference(seekerProfile.jobPreference || 'looking_for_work')
    }
    
    // Get user's applications
    const userApplications = getApplicationsByCandidateId(user.id)
    setApplications(userApplications)
    
    // Get all jobs for reference
    const allJobs = getAllJobs()
    setJobs(allJobs)
  }, [user?.id])

  useEffect(() => {
    loadData()
    
    // Poll for updates every 10 seconds
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [loadData])

  // Handle job preference update
  const handlePreferenceUpdate = async (newPreference: 'looking_for_work' | 'not_looking_for_job') => {
    if (!user?.id) return
    
    setIsUpdatingPreference(true)
    try {
      const updated = updateJobSeekerPreference(user.id, newPreference)
      if (updated) {
        setJobPreference(newPreference)
        setJobSeeker(updated)
      }
    } finally {
      setIsUpdatingPreference(false)
    }
  }

  // Get job details for an application
  const getJobForApplication = (jobId: string) => {
    return jobs.find(j => j.id === jobId)
  }

  // Calculate days remaining from subscription or user's subscription expiry
  const expiryDate = subscription?.expiresAt
  const daysRemaining = expiryDate
    ? Math.max(0, Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : (user?.isSubscribed ? 30 : 0) // Default to 30 days if subscribed but no expiry set

  // Check if user has a completed profile (either from resume context or jobSeeker data)
  const hasCompletedProfile = Boolean(resume?.name || jobSeeker?.name)
  
  // Get profile data from either source (prioritize resume context, fallback to jobSeeker)
  const profileData = {
    name: resume?.name || jobSeeker?.name || user?.name || '',
    role: resume?.role || jobSeeker?.role || 'Beauty Professional',
    experience: resume?.experience || jobSeeker?.experience || '',
    skills: resume?.skills || jobSeeker?.skills || [],
    salaryExpectation: resume?.salaryExpectation || jobSeeker?.salaryExpectation || '',
    dateOfBirth: resume?.dateOfBirth || '',
    location: resume?.location || jobSeeker?.location || null,
    phone: user?.phone || jobSeeker?.phone || '',
    email: user?.email || jobSeeker?.email || '',
  }

  // Download resume as PDF using browser print functionality
  const downloadResume = () => {
    if (!hasCompletedProfile) {
      alert('Please complete your profile first!')
      return
    }
    
    setIsDownloading(true)
    
    try {
      // Create a printable HTML document
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${profileData.name || 'Resume'} - Resume</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #333;
            }
            .header { text-align: center; margin-bottom: 30px; }
            .name { font-size: 28px; font-weight: bold; color: #1a1a1a; margin-bottom: 8px; }
            .role { font-size: 16px; color: #666; margin-bottom: 12px; }
            .contact { font-size: 12px; color: #888; }
            .divider { border-top: 2px solid #e0e0e0; margin: 20px 0; }
            .section { margin-bottom: 24px; }
            .section-title { 
              font-size: 14px; 
              font-weight: bold; 
              color: #1a1a1a; 
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 8px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 4px;
            }
            .section-content { font-size: 13px; line-height: 1.6; color: #444; }
            .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
            .skill-tag { 
              background: #f0f0f0; 
              padding: 4px 12px; 
              border-radius: 16px; 
              font-size: 12px;
            }
            .footer { 
              text-align: center; 
              font-size: 10px; 
              color: #999; 
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
            @media print {
              body { padding: 20px; }
              @page { margin: 0.5in; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="name">${profileData.name || 'Name Not Provided'}</div>
            <div class="role">${profileData.role}</div>
            <div class="contact">
              ${[profileData.phone, profileData.email, profileData.location?.address].filter(Boolean).join(' | ')}
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="section">
            <div class="section-title">Experience</div>
            <div class="section-content">${profileData.experience || 'Fresher'} ${profileData.experience ? 'of experience in the beauty industry' : ''}</div>
          </div>
          
          ${profileData.skills && profileData.skills.length > 0 ? `
          <div class="section">
            <div class="section-title">Skills</div>
            <div class="skills-list">
              ${profileData.skills.map((skill: string) => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
          </div>
          ` : ''}
          
          ${profileData.salaryExpectation ? `
          <div class="section">
            <div class="section-title">Salary Expectation</div>
            <div class="section-content">${profileData.salaryExpectation}</div>
          </div>
          ` : ''}
          
          ${profileData.dateOfBirth ? `
          <div class="section">
            <div class="section-title">Date of Birth</div>
            <div class="section-content">${profileData.dateOfBirth}</div>
          </div>
          ` : ''}
          
          ${profileData.location?.address ? `
          <div class="section">
            <div class="section-title">Location</div>
            <div class="section-content">${profileData.location.address}</div>
          </div>
          ` : ''}
          
          <div class="footer">
            Generated via Salon Jobs India - www.salonjobsindia.com
          </div>
        </body>
        </html>
      `
      
      // Open print window
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.focus()
        
        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print()
          setIsDownloading(false)
        }, 250)
      } else {
        alert('Please allow popups to download your resume')
        setIsDownloading(false)
      }
    } catch (error) {
      console.error('Error generating resume:', error)
      alert('Error generating resume. Please try again.')
      setIsDownloading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'saved', label: 'Saved', icon: Heart, count: savedJobs.length },
    { id: 'applied', label: 'Applied', icon: Briefcase, count: appliedJobs.length },
  ]

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden pb-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-primary/10 to-transparent" />
      
      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToStep(user?.isSubscribed ? 'results' : 'discovery')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold">Profile</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToStep('settings')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>
      
      {/* Profile Card */}
      <div className="relative z-10 px-4 mb-6">
        <div className="p-6 glass-card rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.email?.split('@')[0] || 'User'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          {/* Subscription Status */}
          {user?.isSubscribed ? (
            <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">Premium Active</span>
                </div>
                <span className="text-sm text-muted-foreground">{daysRemaining} days left</span>
              </div>
              <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, (daysRemaining / 30) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <Button
              onClick={() => goToStep('subscription')}
              className="w-full h-12 bg-primary hover:bg-primary/90 gold-glow"
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Premium
            </Button>
          )}
        </div>
      </div>
      
{/* Download Resume Button - Available for ALL job seekers with completed profile */}
          {user?.role === 'job_seeker' && (
            <div className="relative z-10 px-4 mb-4">
              <Button
                onClick={downloadResume}
                disabled={isDownloading || !hasCompletedProfile}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
              >
                {isDownloading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Download Resume (PDF)
                  </>
                )}
              </Button>
              {!hasCompletedProfile && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Complete your profile to download resume
                </p>
              )}
            </div>
          )}
      
      {/* Job Preference Section - Duplicated Block for Job Seekers */}
      {user?.role === 'job_seeker' && (
        <div className="relative z-10 px-4 mb-4">
          {/* Branding Banner */}
          <div className="mb-4 py-2 bg-gradient-to-r from-background via-secondary/30 to-background rounded-xl border border-border/30">
            <BrandingBanner section="job_seeker" />
          </div>
          
          {/* Job Preference Card */}
          <div className="p-5 glass-card rounded-2xl border-2 border-primary/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <SearchIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Job Preference</h3>
                <p className="text-xs text-muted-foreground">Set your current job search status</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Looking for Work Option */}
              <button
                onClick={() => handlePreferenceUpdate('looking_for_work')}
                disabled={isUpdatingPreference}
                className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
                  jobPreference === 'looking_for_work'
                    ? 'bg-green-500/20 border-2 border-green-500/50'
                    : 'bg-secondary/30 border-2 border-transparent hover:border-green-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    jobPreference === 'looking_for_work' ? 'bg-green-500/30' : 'bg-secondary/50'
                  }`}>
                    <CheckCircle2 className={`w-5 h-5 ${
                      jobPreference === 'looking_for_work' ? 'text-green-400' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${
                      jobPreference === 'looking_for_work' ? 'text-green-400' : 'text-foreground'
                    }`}>
                      Looking for Work
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Salon owners can see your profile
                    </p>
                  </div>
                </div>
                {jobPreference === 'looking_for_work' && (
                  <span className="px-2 py-1 text-xs rounded-full bg-green-500/30 text-green-400">Active</span>
                )}
              </button>
              
              {/* Not Looking for Job Option */}
              <button
                onClick={() => handlePreferenceUpdate('not_looking_for_job')}
                disabled={isUpdatingPreference}
                className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
                  jobPreference === 'not_looking_for_job'
                    ? 'bg-amber-500/20 border-2 border-amber-500/50'
                    : 'bg-secondary/30 border-2 border-transparent hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    jobPreference === 'not_looking_for_job' ? 'bg-amber-500/30' : 'bg-secondary/50'
                  }`}>
                    <XCircle className={`w-5 h-5 ${
                      jobPreference === 'not_looking_for_job' ? 'text-amber-400' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${
                      jobPreference === 'not_looking_for_job' ? 'text-amber-400' : 'text-foreground'
                    }`}>
                      Not Looking for Job
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Hide your profile from salon owners
                    </p>
                  </div>
                </div>
                {jobPreference === 'not_looking_for_job' && (
                  <span className="px-2 py-1 text-xs rounded-full bg-amber-500/30 text-amber-400">Hidden</span>
                )}
              </button>
            </div>
            
            {/* Status Info */}
            <div className={`mt-4 p-3 rounded-lg ${
              jobPreference === 'looking_for_work' 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-amber-500/10 border border-amber-500/20'
            }`}>
              <p className="text-xs text-center">
                {jobPreference === 'looking_for_work' 
                  ? 'Your profile is visible to salon owners who have approved subscriptions'
                  : 'Your profile is hidden. Only salons you applied to can see your details'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="relative z-10 px-4 mb-4">
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
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-primary-foreground/20' : 'bg-secondary'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="relative z-10 flex-1 px-4 pb-4 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-slide-up">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 glass-card rounded-xl">
                <Heart className="w-6 h-6 text-accent mb-2" />
                <p className="text-2xl font-bold">{savedJobs.length}</p>
                <p className="text-sm text-muted-foreground">Saved Jobs</p>
              </div>
              <div className="p-4 glass-card rounded-xl">
                <Briefcase className="w-6 h-6 text-primary mb-2" />
                <p className="text-2xl font-bold">{appliedJobs.length}</p>
                <p className="text-sm text-muted-foreground">Applications</p>
              </div>
              <div className="p-4 glass-card rounded-xl">
                <Eye className="w-6 h-6 text-green-500 mb-2" />
                <p className="text-2xl font-bold">23</p>
                <p className="text-sm text-muted-foreground">Profile Views</p>
              </div>
              <div className="p-4 glass-card rounded-xl">
                <TrendingUp className="w-6 h-6 text-amber-500 mb-2" />
                <p className="text-2xl font-bold">85%</p>
                <p className="text-sm text-muted-foreground">Match Rate</p>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="mt-4">
              <h3 className="font-semibold mb-3">Recent Activity</h3>
              <div className="space-y-3">
                <div className="p-3 glass-card rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Glamour Studio viewed your profile</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 2 hours ago
                    </p>
                  </div>
                </div>
                <div className="p-3 glass-card rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New job match: Hair Stylist at Style Haven</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 5 hours ago
                    </p>
                  </div>
                </div>
                <div className="p-3 glass-card rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Subscription activated successfully</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 1 day ago
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Menu Items */}
            <div className="space-y-2">
              <button className="w-full p-4 glass-card rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Notifications</p>
                    <p className="text-xs text-muted-foreground">Manage alerts</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              
              <button className="w-full p-4 glass-card rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Privacy & Security</p>
                    <p className="text-xs text-muted-foreground">Account settings</p>
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
        
        {activeTab === 'saved' && (
          <div className="space-y-3 animate-slide-up">
            {savedJobs.length > 0 ? (
              savedJobs.map((jobId) => (
                <div key={jobId} className="p-4 glass-card rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Saved Job</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-accent text-accent" />
                        Job ID: {jobId}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => goToStep('results')}
                  >
                    View in Jobs
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Heart className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No saved jobs</h3>
                <p className="text-sm text-muted-foreground">Jobs you save will appear here</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'applied' && (
          <div className="space-y-3 animate-slide-up">
            {/* Real Applications from Data Store */}
            {applications.length > 0 ? (
              applications.map((app) => {
                const job = getJobForApplication(app.jobId)
                return (
                  <div key={app.id} className="p-4 glass-card rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{app.jobRole || job?.role || 'Job Application'}</h4>
                          <p className="text-xs text-muted-foreground">{app.salonName || job?.salonName}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        app.status === 'applied' ? 'bg-blue-500/20 text-blue-400' :
                        app.status === 'viewed' ? 'bg-amber-500/20 text-amber-400' :
                        app.status === 'shortlisted' ? 'bg-primary/20 text-primary' :
                        app.status === 'selected' ? 'bg-green-500/20 text-green-400' :
                        app.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-secondary text-muted-foreground'
                      }`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>
                    
                    {/* Application Details */}
                    <div className="space-y-2 mb-3">
                      {job && (
                        <>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{job.location?.address || job.location?.area || 'Location not specified'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>Applied {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Contact Unlocked Info */}
                    {app.isContactUnlocked && (
                      <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-xs text-green-400 text-center">
                          Salon owner has unlocked your contact details
                        </p>
                      </div>
                    )}
                  </div>
                )
              })
            ) : appliedJobs.length > 0 ? (
              // Fallback to local applied jobs if no applications in data store
              appliedJobs.map((jobId) => {
                const job = jobs.find(j => j.id === jobId)
                return (
                  <div key={jobId} className="p-4 glass-card rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{job?.role || 'Job Application'}</h4>
                          <p className="text-xs text-muted-foreground">{job?.salonName || `Application ID: ${jobId.slice(0, 8)}`}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                        Pending
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No applications yet</h3>
                <p className="text-sm text-muted-foreground">Your job applications will appear here</p>
                <Button 
                  onClick={() => goToStep('results')} 
                  className="mt-4"
                  variant="outline"
                >
                  Browse Jobs
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
