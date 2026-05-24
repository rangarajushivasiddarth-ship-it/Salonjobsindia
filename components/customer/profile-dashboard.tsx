'use client'

import { useState } from 'react'
import { ArrowLeft, User, Crown, Calendar, Heart, Briefcase, LogOut, ChevronRight, MapPin, Building2, Settings, Bell, Shield, TrendingUp, Eye, Clock, Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'

type TabType = 'overview' | 'saved' | 'applied'

export function ProfileDashboard() {
  const { user, subscription, savedJobs, appliedJobs, goToStep, logout, resume } = useApp()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isDownloading, setIsDownloading] = useState(false)

  // Calculate days remaining from subscription or user's subscription expiry
  const expiryDate = subscription?.expiresAt || user?.subscriptionExpiry
  const daysRemaining = expiryDate
    ? Math.max(0, Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : (user?.isSubscribed ? 30 : 0) // Default to 30 days if subscribed but no expiry set

  // Download resume as PDF - dynamically import jsPDF to avoid SSR issues
  const downloadResume = async () => {
    if (!resume) {
      alert('Please complete your resume first!')
      return
    }
    
    setIsDownloading(true)
    
    try {
      // Dynamic import to avoid SSR issues with jsPDF
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      let yPos = 20
      
      // Title - Name
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text(resume.name || user?.name || 'Name Not Provided', pageWidth / 2, yPos, { align: 'center' })
      yPos += 10
      
      // Role
      doc.setFontSize(14)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(resume.role || 'Beauty Professional', pageWidth / 2, yPos, { align: 'center' })
      yPos += 15
      
      // Contact Info
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      const contactInfo = [
        user?.phone || '',
        user?.email || '',
        resume.location?.address || ''
      ].filter(Boolean).join(' | ')
      doc.text(contactInfo, pageWidth / 2, yPos, { align: 'center' })
      yPos += 15
      
      // Divider
      doc.setDrawColor(200, 200, 200)
      doc.line(20, yPos, pageWidth - 20, yPos)
      yPos += 10
      
      // Experience
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('EXPERIENCE', 20, yPos)
      yPos += 8
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`${resume.experience || '0'} years of experience in the beauty industry`, 20, yPos)
      yPos += 15
      
      // Skills
      if (resume.skills && resume.skills.length > 0) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('SKILLS', 20, yPos)
        yPos += 8
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const skillsText = resume.skills.join(', ')
        const splitSkills = doc.splitTextToSize(skillsText, pageWidth - 40)
        doc.text(splitSkills, 20, yPos)
        yPos += splitSkills.length * 5 + 15
      }
      
      // Salary Expectation
      if (resume.salaryExpectation) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('SALARY EXPECTATION', 20, yPos)
        yPos += 8
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.text(resume.salaryExpectation, 20, yPos)
        yPos += 15
      }
      
      // Date of Birth
      if (resume.dateOfBirth) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('DATE OF BIRTH', 20, yPos)
        yPos += 8
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.text(resume.dateOfBirth, 20, yPos)
        yPos += 15
      }
      
      // Location
      if (resume.location?.address) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('LOCATION', 20, yPos)
        yPos += 8
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.text(resume.location.address, 20, yPos)
        yPos += 15
      }
      
      // Footer
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('Generated via Salon Jobs India - www.salonjobsindia.com', pageWidth / 2, 285, { align: 'center' })
      
      // Save the PDF
      const fileName = `${(resume.name || user?.name || 'resume').replace(/\s+/g, '_')}_Resume.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    } finally {
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToStep('settings')}
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="w-5 h-5" />
        </Button>
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
      
      {/* Download Resume Button - Only for job seekers */}
      {user?.role === 'job_seeker' && (
        <div className="relative z-10 px-4 mb-4">
          <Button
            onClick={downloadResume}
            disabled={isDownloading || !resume}
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
          {!resume && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Complete your profile to download resume
            </p>
          )}
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
            {appliedJobs.length > 0 ? (
              appliedJobs.map((jobId) => (
                <div key={jobId} className="p-4 glass-card rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Job Application</h4>
                        <p className="text-xs text-muted-foreground">Application ID: {jobId.slice(0, 8)}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                      Pending
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No applications yet</h3>
                <p className="text-sm text-muted-foreground">Your job applications will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
