'use client'

import { useState } from 'react'
import { ArrowLeft, User, Bell, Shield, Moon, Sun, Globe, HelpCircle, FileText, LogOut, ChevronRight, Camera, Mail, Phone, MapPin, Edit2, Check, X, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/lib/app-context'
import { useLanguage } from '@/lib/language-context'
import Image from 'next/image'

type SettingsTab = 'main' | 'edit-profile' | 'notifications' | 'privacy' | 'help'

export function SettingsScreen() {
  const { user, goToStep, logout, updateUser } = useApp()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<SettingsTab>('main')
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [notificationSettings, setNotificationSettings] = useState({
    jobAlerts: true,
    messages: true,
    promotions: false,
    reminders: true,
  })
  const [isLookingForJob, setIsLookingForJob] = useState(true)
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  
  const handleSaveProfile = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    updateUser({
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
    })
    
    // Update in registered users storage
    const registeredUsersStr = localStorage.getItem('salonjobsindia_registered_users')
    if (registeredUsersStr && user?.email) {
      const registeredUsers = JSON.parse(registeredUsersStr)
      const emailKey = user.email.toLowerCase()
      if (registeredUsers[emailKey]) {
        registeredUsers[emailKey].user = {
          ...registeredUsers[emailKey].user,
          name: editForm.name,
          phone: editForm.phone,
        }
        localStorage.setItem('salonjobsindia_registered_users', JSON.stringify(registeredUsers))
      }
    }
    
    // Update current user in storage
    const currentUser = localStorage.getItem('salonjobsindia_user')
    if (currentUser) {
      const parsed = JSON.parse(currentUser)
      localStorage.setItem('salonjobsindia_user', JSON.stringify({
        ...parsed,
        name: editForm.name,
        phone: editForm.phone,
      }))
    }
    
    setIsSaving(false)
    setActiveTab('main')
  }

  const handleToggleLookingForJob = () => {
    const newValue = !isLookingForJob
    setIsLookingForJob(newValue)
    
    // Update in localStorage for job seekers
    const resumeStr = localStorage.getItem('salonjobsindia_resumes')
    if (resumeStr && user?.id) {
      const resumes = JSON.parse(resumeStr)
      const userResume = resumes.find((r: { userId: string }) => r.userId === user.id)
      if (userResume) {
        userResume.availabilityStatus = newValue ? 'actively_looking' : 'not_looking'
        localStorage.setItem('salonjobsindia_resumes', JSON.stringify(resumes))
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('localStorageUpdate', { detail: { key: 'salonjobsindia_resumes' } }))
      }
    }
  }
  
  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        enabled ? 'bg-primary' : 'bg-secondary'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
  
  // Edit Profile View
  if (activeTab === 'edit-profile') {
    return (
      <div className="relative min-h-screen flex flex-col overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
        
        <header className="relative z-10 p-4 glass">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveTab('main')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">Edit Profile</h1>
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </header>
        
        <div className="relative z-10 flex-1 p-4 overflow-y-auto pb-20">
          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-12 h-12 text-primary" />
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Camera className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Tap to change photo</p>
          </div>
          
          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="h-12 pl-12 bg-secondary/50 border-border/50"
                  placeholder="Enter your name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="h-12 pl-12 bg-secondary/50 border-border/50"
                  placeholder="Enter your email"
                  disabled
                />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="h-12 pl-12 bg-secondary/50 border-border/50"
                  placeholder="Enter your phone"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  className="h-12 pl-12 bg-secondary/50 border-border/50"
                  placeholder="Enter your location"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Notifications Settings View
  if (activeTab === 'notifications') {
    return (
      <div className="relative min-h-screen flex flex-col overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
        
        <header className="relative z-10 p-4 glass">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab('main')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Notifications</h1>
          </div>
        </header>
        
        <div className="relative z-10 flex-1 p-4 overflow-y-auto pb-20">
          <div className="space-y-4">
            <div className="p-4 glass-card rounded-xl flex items-center justify-between">
              <div>
                <h3 className="font-medium">Job Alerts</h3>
                <p className="text-sm text-muted-foreground">Get notified about new job matches</p>
              </div>
              <ToggleSwitch
                enabled={notificationSettings.jobAlerts}
                onChange={() => setNotificationSettings(prev => ({ ...prev, jobAlerts: !prev.jobAlerts }))}
              />
            </div>
            
            <div className="p-4 glass-card rounded-xl flex items-center justify-between">
              <div>
                <h3 className="font-medium">Messages</h3>
                <p className="text-sm text-muted-foreground">Get notified about new messages</p>
              </div>
              <ToggleSwitch
                enabled={notificationSettings.messages}
                onChange={() => setNotificationSettings(prev => ({ ...prev, messages: !prev.messages }))}
              />
            </div>
            
            <div className="p-4 glass-card rounded-xl flex items-center justify-between">
              <div>
                <h3 className="font-medium">Promotions</h3>
                <p className="text-sm text-muted-foreground">Receive special offers and updates</p>
              </div>
              <ToggleSwitch
                enabled={notificationSettings.promotions}
                onChange={() => setNotificationSettings(prev => ({ ...prev, promotions: !prev.promotions }))}
              />
            </div>
            
            <div className="p-4 glass-card rounded-xl flex items-center justify-between">
              <div>
                <h3 className="font-medium">Reminders</h3>
                <p className="text-sm text-muted-foreground">Profile completion & interview reminders</p>
              </div>
              <ToggleSwitch
                enabled={notificationSettings.reminders}
                onChange={() => setNotificationSettings(prev => ({ ...prev, reminders: !prev.reminders }))}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Main Settings View
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden pb-20">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      
      <header className="relative z-10 p-4 glass">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToStep('profile')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>
      
      <div className="relative z-10 flex-1 p-4 overflow-y-auto">
        {/* Profile Card */}
        <button
          onClick={() => setActiveTab('edit-profile')}
          className="w-full p-4 glass-card rounded-xl flex items-center gap-4 mb-6"
        >
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold">{user?.name || user?.email?.split('@')[0] || 'User'}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Edit2 className="w-5 h-5 text-muted-foreground" />
        </button>
        
        {/* Settings Menu */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider px-2 mb-2">Preferences</p>
          
          {/* Job Seeking Status - Only for Job Seekers */}
          {user?.role === 'job_seeker' && (
            <div className="p-4 glass-card rounded-xl flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLookingForJob ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
                  <Briefcase className={`w-5 h-5 ${isLookingForJob ? 'text-green-500' : 'text-orange-500'}`} />
                </div>
                <div>
                  <span className="font-medium">Looking for Job</span>
                  <p className="text-xs text-muted-foreground">
                    {isLookingForJob ? 'Visible to salon owners' : 'Hidden from salon owners'}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                enabled={isLookingForJob}
                onChange={handleToggleLookingForJob}
              />
            </div>
          )}
          
          <button
            onClick={() => setActiveTab('notifications')}
            className="w-full p-4 glass-card rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">Notifications</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <div className="p-4 glass-card rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                {isDarkMode ? <Moon className="w-5 h-5 text-accent" /> : <Sun className="w-5 h-5 text-accent" />}
              </div>
              <span className="font-medium">Dark Mode</span>
            </div>
            <ToggleSwitch
              enabled={isDarkMode}
              onChange={() => setIsDarkMode(!isDarkMode)}
            />
          </div>
          
          <button className="w-full p-4 glass-card rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center">
                <Globe className="w-5 h-5 text-foreground" />
              </div>
              <div className="text-left">
                <span className="font-medium">Language</span>
                <p className="text-xs text-muted-foreground">English</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        <div className="space-y-2 mt-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider px-2 mb-2">Security</p>
          
          <button className="w-full p-4 glass-card rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center">
                <Shield className="w-5 h-5 text-foreground" />
              </div>
              <span className="font-medium">Privacy & Security</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        <div className="space-y-2 mt-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider px-2 mb-2">Support</p>
          
          <button className="w-full p-4 glass-card rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-foreground" />
              </div>
              <span className="font-medium">Help Center</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <button className="w-full p-4 glass-card rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center">
                <FileText className="w-5 h-5 text-foreground" />
              </div>
              <span className="font-medium">Terms & Privacy Policy</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        {/* Logout */}
        <button
          onClick={logout}
          className="w-full mt-6 p-4 glass-card rounded-xl flex items-center justify-between text-destructive"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-medium">Log Out</span>
          </div>
          <ChevronRight className="w-5 h-5" />
        </button>
        
        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Salon Jobs India v1.0.0
        </p>
        <p className="text-center text-xs text-muted-foreground mt-1">
          Powered by Fitonze Private Limited
        </p>
      </div>
    </div>
  )
}
