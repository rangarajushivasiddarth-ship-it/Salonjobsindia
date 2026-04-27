'use client'

import { useState, useEffect } from 'react'
import { Search, Lock, MapPin, Building2, User, Unlock, Filter, ChevronRight, MessageCircle, Phone, X, Send, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/lib/app-context'
import { getAllJobs, canViewMoreShops, incrementShopsViewed, sendMessage, getSubscriptionByUserId } from '@/lib/data-store'
import type { Job } from '@/lib/types'

// Mock salon data (names only - details locked)
const MOCK_SALONS = [
  { id: '1', name: 'Glamour Studio', ownerId: 'owner1', ownerPhone: '9876543210' },
  { id: '2', name: 'Style Haven', ownerId: 'owner2', ownerPhone: '9876543211' },
  { id: '3', name: 'Beauty Bliss', ownerId: 'owner3', ownerPhone: '9876543212' },
  { id: '4', name: 'Chic Cuts', ownerId: 'owner4', ownerPhone: '9876543213' },
  { id: '5', name: 'Luxe Salon', ownerId: 'owner5', ownerPhone: '9876543214' },
  { id: '6', name: 'Hair Artistry', ownerId: 'owner6', ownerPhone: '9876543215' },
  { id: '7', name: 'Elegant Touch', ownerId: 'owner7', ownerPhone: '9876543216' },
  { id: '8', name: 'Modern Mane', ownerId: 'owner8', ownerPhone: '9876543217' },
  { id: '9', name: 'Pristine Beauty', ownerId: 'owner9', ownerPhone: '9876543218' },
  { id: '10', name: 'Urban Styling', ownerId: 'owner10', ownerPhone: '9876543219' },
]

interface SalonWithDetails {
  id: string
  name: string
  ownerId: string
  ownerPhone: string
  job?: Job
  isUnlocked?: boolean
}

export function JobDiscovery() {
  const { user, goToStep } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false)
  const [selectedSalon, setSelectedSalon] = useState<SalonWithDetails | null>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [messageSent, setMessageSent] = useState(false)
  const [showLimitReached, setShowLimitReached] = useState(false)
  const [salons, setSalons] = useState<SalonWithDetails[]>(MOCK_SALONS)
  const [viewStats, setViewStats] = useState({ remaining: 0 as number | 'unlimited', total: 0 as number | 'unlimited' })
  const [unlockedSalons, setUnlockedSalons] = useState<Set<string>>(new Set())
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [areaFilter, setAreaFilter] = useState('')

  // Load jobs and subscription status
  useEffect(() => {
    if (!user?.id) return
    
    const jobs = getAllJobs()
    const subscription = getSubscriptionByUserId(user.id)
    
    // Map jobs to salons
    const salonsWithJobs = MOCK_SALONS.map(salon => {
      const job = jobs.find(j => j.salonId === salon.id)
      return { ...salon, job }
    })
    
    setSalons(salonsWithJobs)
    
    // Load unlocked salons from localStorage
    const unlockedStr = localStorage.getItem(`fitonze_unlocked_${user.id}`)
    if (unlockedStr) {
      setUnlockedSalons(new Set(JSON.parse(unlockedStr)))
    }
    
    // Check view stats
    if (subscription?.status === 'approved') {
      const stats = canViewMoreShops(user.id)
      setViewStats({ remaining: stats.remaining, total: stats.total })
    }
  }, [user?.id])

  const filteredSalons = salons.filter(salon => {
    const matchesName = salon.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesArea = !areaFilter || (salon.job?.location?.area?.toLowerCase().includes(areaFilter.toLowerCase()) || 
                        salon.job?.location?.address?.toLowerCase().includes(areaFilter.toLowerCase()))
    return matchesName && matchesArea
  })

  const isSubscribed = user?.isSubscribed === true
  const subscription = user?.id ? getSubscriptionByUserId(user.id) : null
  const isApproved = subscription?.status === 'approved'

  const handleSalonClick = (salon: SalonWithDetails) => {
    if (!isApproved) {
      // Not subscribed or pending - show subscribe prompt
      setShowUnlockPrompt(true)
      return
    }
    
    // Check if already unlocked
    if (unlockedSalons.has(salon.id)) {
      setSelectedSalon({ ...salon, isUnlocked: true })
      return
    }
    
    // Check if can view more shops
    const stats = canViewMoreShops(user?.id || '')
    if (!stats.canView) {
      setShowLimitReached(true)
      return
    }
    
    // Unlock this salon
    if (incrementShopsViewed(user?.id || '')) {
      const newUnlocked = new Set(unlockedSalons)
      newUnlocked.add(salon.id)
      setUnlockedSalons(newUnlocked)
      localStorage.setItem(`fitonze_unlocked_${user?.id}`, JSON.stringify([...newUnlocked]))
      
      // Update view stats
      const newStats = canViewMoreShops(user?.id || '')
      setViewStats({ remaining: newStats.remaining, total: newStats.total })
      
      setSelectedSalon({ ...salon, isUnlocked: true })
    }
  }

  const handleSendMessage = () => {
    if (!selectedSalon || !messageText.trim() || !user) return
    
    // Send via WhatsApp
    const phone = selectedSalon.ownerPhone.replace(/\D/g, '')
    const message = encodeURIComponent(
      `Hi! I'm ${user.name || user.email} interested in the ${selectedSalon.job?.role || 'job opening'} position at ${selectedSalon.name}.\n\n${messageText}`
    )
    window.open(`https://wa.me/91${phone}?text=${message}`, '_blank')
    
    // Also save to data store
    sendMessage({
      fromUserId: user.id,
      fromUserName: user.name || user.email,
      fromUserPhone: user.phone,
      toUserId: selectedSalon.ownerId,
      toSalonName: selectedSalon.name,
      jobId: selectedSalon.job?.id || '',
      jobRole: selectedSalon.job?.role || 'General Position',
      message: messageText,
    })
    
    setMessageSent(true)
    setTimeout(() => {
      setShowMessageModal(false)
      setMessageText('')
      setMessageSent(false)
    }, 2000)
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden pb-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      
      {/* Header */}
      <header className="relative z-10 p-4 glass">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Discover Salons</h1>
            <p className="text-sm text-muted-foreground">Find opportunities near you</p>
          </div>
          <button 
            onClick={() => goToStep('profile')}
            className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"
          >
            <User className="w-5 h-5 text-primary" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search salons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-12 pr-12 bg-secondary/50 border-border/50"
          />
          <button 
            onClick={() => setShowFilterModal(true)}
            className={`absolute right-4 top-1/2 -translate-y-1/2 ${areaFilter ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Filter className="w-5 h-5" />
            {areaFilter && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
        </div>
        
        {/* Active Filter Badge */}
        {areaFilter && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filtered by:</span>
            <span className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/20 text-primary rounded-full">
              <MapPin className="w-3 h-3" />
              {areaFilter}
              <button
                onClick={() => setAreaFilter('')}
                className="ml-1 hover:text-primary-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}
      </header>
      
      {/* Subscription Status Banner */}
      {isApproved && viewStats.total !== 0 && (
        <div className="relative z-10 mx-4 mt-4 p-3 glass-card rounded-xl border border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">
                {viewStats.remaining === 'unlimited' 
                  ? 'Unlimited views' 
                  : `${viewStats.remaining} of ${viewStats.total} views remaining`
                }
              </span>
            </div>
            {viewStats.remaining !== 'unlimited' && typeof viewStats.remaining === 'number' && viewStats.remaining <= 3 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => goToStep('subscription')}
                className="text-xs h-8"
              >
                Upgrade
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Info Banner */}
      {!isApproved && (
        <div className="relative z-10 mx-4 mt-4 p-4 glass-card rounded-xl border border-accent/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Details Locked</h3>
              <p className="text-xs text-muted-foreground">
                Subscribe to unlock full salon details, contact info, and job descriptions
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Salon List */}
      <div className="relative z-10 flex-1 p-4 overflow-y-auto">
        <div className="space-y-3">
          {filteredSalons.map((salon, index) => {
            const isUnlocked = unlockedSalons.has(salon.id)
            
            return (
              <button
                key={salon.id}
                onClick={() => handleSalonClick(salon)}
                className="w-full p-4 glass-card rounded-xl text-left transition-all duration-300 hover:scale-[1.01] animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Salon Avatar */}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      isUnlocked ? 'bg-primary/20' : 'bg-secondary/80'
                    }`}>
                      <Building2 className={`w-7 h-7 ${isUnlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    
                    {/* Salon Info */}
                    <div>
                      <h3 className="font-semibold text-lg">{salon.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {isUnlocked ? (
                          <span className="flex items-center gap-1 text-xs text-primary">
                            <Unlock className="w-3 h-3" />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="blur-sm select-none">Location hidden</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Lock/Unlock Icon */}
                  <div className="flex items-center gap-2">
                    {isUnlocked ? (
                      <Unlock className="w-5 h-5 text-primary" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                
                {/* Details */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  {isUnlocked && salon.job ? (
                    <div className="flex gap-3">
                      <span className="px-3 py-1 text-xs rounded-full bg-primary/20 text-primary">
                        {salon.job.role}
                      </span>
                      <span className="px-3 py-1 text-xs rounded-full bg-secondary/50 text-foreground">
                        {salon.job.salary}
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <span className="px-3 py-1 text-xs rounded-full bg-secondary/50 text-muted-foreground blur-sm select-none">
                        Role hidden
                      </span>
                      <span className="px-3 py-1 text-xs rounded-full bg-secondary/50 text-muted-foreground blur-sm select-none">
                        Salary hidden
                      </span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
        
        {filteredSalons.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No salons found</h3>
            <p className="text-sm text-muted-foreground">Try a different search term</p>
          </div>
        )}
      </div>
      
      {/* Unlock CTA */}
      {!isApproved && (
        <div className="relative z-10 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <Button
            onClick={() => goToStep('subscription')}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gold-glow transition-all duration-300 hover:scale-[1.02]"
          >
            <Unlock className="w-5 h-5 mr-2" />
            Unlock Full Details
          </Button>
        </div>
      )}
      
      {/* Unlock Prompt Modal */}
      {showUnlockPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 glass-card rounded-2xl gold-glow animate-scale-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">Content Locked</h3>
              <p className="text-muted-foreground mb-6">
                Subscribe to view full salon details including location, contact info, and job descriptions.
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => setShowUnlockPrompt(false)}
                  className="flex-1 h-12"
                >
                  Later
                </Button>
                <Button
                  onClick={() => {
                    setShowUnlockPrompt(false)
                    goToStep('subscription')
                  }}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90"
                >
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Limit Reached Modal */}
      {showLimitReached && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 glass-card rounded-2xl animate-scale-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                <Crown className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">View Limit Reached</h3>
              <p className="text-muted-foreground mb-6">
                You&apos;ve used all your salon views. Upgrade your plan to view more salons.
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => setShowLimitReached(false)}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowLimitReached(false)
                    goToStep('subscription')
                  }}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90"
                >
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Salon Details Modal */}
      {selectedSalon?.isUnlocked && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 glass-card rounded-t-3xl animate-slide-up">
            <button
              onClick={() => setSelectedSalon(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedSalon.name}</h2>
                {selectedSalon.job && (
                  <p className="text-primary font-medium">{selectedSalon.job.role}</p>
                )}
              </div>
            </div>
            
            {selectedSalon.job && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span>{selectedSalon.job.location.address}, {selectedSalon.job.location.area}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">Salary:</span>
                  <span className="font-semibold">{selectedSalon.job.salary}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">Experience:</span>
                  <span>{selectedSalon.job.experience}</span>
                </div>
                {selectedSalon.job.contact && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <span>{selectedSalon.job.contact}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const phone = selectedSalon.ownerPhone.replace(/\D/g, '')
                  window.open(`tel:+91${phone}`, '_self')
                }}
                className="flex-1 h-12"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call
              </Button>
              <Button
                onClick={() => setShowMessageModal(true)}
                className="flex-1 h-12 bg-primary hover:bg-primary/90"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Message
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Message Modal */}
      {showMessageModal && selectedSalon && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 glass-card rounded-2xl animate-scale-in">
            {messageSent ? (
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <Send className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                <p className="text-muted-foreground">WhatsApp opened with your message</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-4">Message to {selectedSalon.name}</h3>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Write your message here... (e.g., I am interested in this position and have 3 years of experience...)"
                  className="w-full h-32 p-3 bg-secondary/50 border border-border/50 rounded-xl resize-none focus:outline-none focus:border-primary"
                />
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowMessageModal(false)
                      setMessageText('')
                    }}
                    className="flex-1 h-12"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="flex-1 h-12 bg-primary hover:bg-primary/90"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send via WhatsApp
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 glass-card rounded-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Filter by Area</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 hover:bg-secondary/50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Enter area, city or town..."
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="h-12 pl-12 bg-secondary/50 border-border/50 focus:border-primary"
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                Search by area name, city, or town to find salons in that location
              </p>
              
              {/* Quick area suggestions */}
              <div className="flex flex-wrap gap-2">
                {['Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield', 'Jayanagar'].map(area => (
                  <button
                    key={area}
                    onClick={() => setAreaFilter(area)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                      areaFilter === area
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setAreaFilter('')
                  setShowFilterModal(false)
                }}
                className="flex-1 h-12"
              >
                Clear
              </Button>
              <Button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 h-12 bg-primary hover:bg-primary/90"
              >
                Apply Filter
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
