'use client'

import { useState, useEffect } from 'react'
import { Search, Lock, MapPin, Building2, User, Unlock, Filter, ChevronRight, MessageCircle, Phone, X, Send, Crown, Briefcase, DollarSign, Clock, Star, Navigation, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/lib/app-context'
import { useLanguage, type LanguageCode } from '@/lib/language-context'
import { useTranslation } from '@/lib/use-translation'
import { getAllJobs, canViewMoreShops, incrementShopsViewed, sendMessage, getSubscriptionByUserId, syncApprovedJobsFromCloud } from '@/lib/data-store'
import type { Job, BeautyRole } from '@/lib/types'
import { BEAUTY_ROLES, ROLE_CATEGORIES } from '@/lib/types'
import { BrandingBanner } from './branding-banner'

interface SalonWithDetails {
  id: string
  name: string
  ownerId: string
  ownerPhone: string
  rating?: number
  reviewCount?: number
  job?: {
    role: BeautyRole
    salary: string
    experience: string
    location: { address: string; area: string; city: string; lat: number; lng: number }
    timing?: string
    gender?: 'male' | 'female' | 'any'
    accommodation?: boolean
    foodProvided?: boolean
  }
  distance?: number
  isUnlocked?: boolean
}

export function JobDiscovery() {
  const { user, goToStep, resume } = useApp()
  const { setLanguage } = useLanguage()
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false)
  const [selectedSalon, setSelectedSalon] = useState<SalonWithDetails | null>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [messageSent, setMessageSent] = useState(false)
  const [showLimitReached, setShowLimitReached] = useState(false)
  const [salons, setSalons] = useState<SalonWithDetails[]>([])
  const [viewStats, setViewStats] = useState({ remaining: 0 as number | 'unlimited', total: 0 as number | 'unlimited' })
  const [unlockedSalons, setUnlockedSalons] = useState<Set<string>>(new Set())
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedRole, setSelectedRole] = useState<BeautyRole | 'All'>('All')
  const [areaFilter, setAreaFilter] = useState('')
  const [salaryFilter, setSalaryFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<'distance' | 'salary' | 'rating' | 'newest'>('distance')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  // Get user location
  useEffect(() => {
    if (resume?.location?.lat && resume?.location?.lng) {
      setUserLocation({ lat: resume.location.lat, lng: resume.location.lng })
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 12.9716, lng: 77.5946 }) // Default to Bangalore
      )
    }
  }, [resume])

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Load jobs and subscription status
  useEffect(() => {
    if (!user?.id) return
    
    // First sync approved jobs from cloud, then load all jobs
    const loadJobs = async () => {
      await syncApprovedJobsFromCloud()
      
      const realJobs = getAllJobs().filter(job => job.isActive && job.status === 'live')
      const subscription = getSubscriptionByUserId(user.id)
      
      // Convert real jobs to salon format with distance calculation
      const allSalons: SalonWithDetails[] = realJobs.map(job => {
        let distance: number | undefined
        if (userLocation && job.location) {
          distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            job.location.lat, job.location.lng
          )
        }
        
        return {
          id: job.salonId || job.id,
          name: job.salonName,
          ownerId: job.salonId || job.id,
          ownerPhone: job.salonMobile || job.contact || '',
          job: {
            role: job.role as BeautyRole,
            salary: job.salaryFixed || job.salaryRange || 'Negotiable',
            experience: job.experience,
            location: job.location as { address: string; area: string; city: string; lat: number; lng: number },
          },
          distance
        }
      })
      
      setSalons(allSalons)
      
      // Load unlocked salons
      const unlockedStr = localStorage.getItem(`fitonze_unlocked_${user.id}`)
      if (unlockedStr) {
        setUnlockedSalons(new Set(JSON.parse(unlockedStr)))
      }
      
      // Check view stats
      if (subscription?.status === 'approved') {
        const stats = canViewMoreShops(user.id)
        setViewStats({ remaining: stats.remaining, total: stats.total })
      }
    }
    
    loadJobs()
  }, [user?.id, userLocation])

  // Filter and sort salons
  const filteredSalons = salons
    .filter(salon => {
      // Search query
      const matchesSearch = !searchQuery || 
        salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.job?.role?.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Category filter
      const roleData = BEAUTY_ROLES.find(r => r.role === salon.job?.role)
      const matchesCategory = selectedCategory === 'All' || roleData?.category === selectedCategory
      
      // Role filter
      const matchesRole = selectedRole === 'All' || salon.job?.role === selectedRole
      
      // Area filter
      const matchesArea = !areaFilter || 
        salon.job?.location?.area?.toLowerCase().includes(areaFilter.toLowerCase()) ||
        salon.job?.location?.city?.toLowerCase().includes(areaFilter.toLowerCase())
      
      return matchesSearch && matchesCategory && matchesRole && matchesArea
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance || 999) - (b.distance || 999)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'salary':
          const getSalaryNum = (s: string) => parseInt(s.replace(/[^\d]/g, '')) || 0
          return getSalaryNum(b.job?.salary || '0') - getSalaryNum(a.job?.salary || '0')
        default:
          return 0
      }
    })

  const isSubscribed = user?.isSubscribed === true
  const subscription = user?.id ? getSubscriptionByUserId(user.id) : null
  const isApproved = subscription?.status === 'approved'

  const handleSalonClick = (salon: SalonWithDetails) => {
    // All users can view salon details, but phone numbers are blurred for non-subscribers
    setSelectedSalon({ ...salon, isUnlocked: isApproved })
  }

  const handleSendMessage = () => {
    if (!selectedSalon || !messageText.trim() || !user) return
    
    const phone = selectedSalon.ownerPhone.replace(/\D/g, '')
    const message = encodeURIComponent(
      `Hi! I'm ${user.name || user.email} interested in the ${selectedSalon.job?.role || 'job opening'} position at ${selectedSalon.name}.\n\n${messageText}`
    )
    window.open(`https://wa.me/91${phone}?text=${message}`, '_blank')
    
    sendMessage({
      fromUserId: user.id,
      fromUserName: user.name || user.email,
      fromUserPhone: user.phone,
      toUserId: selectedSalon.ownerId,
      toSalonName: selectedSalon.name,
      jobId: selectedSalon.id,
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

  const activeFiltersCount = [
    selectedCategory !== 'All',
    selectedRole !== 'All',
    areaFilter !== '',
  ].filter(Boolean).length

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden pb-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      {/* Branding Banner - Find Jobs in Home */}
      <div className="relative z-10 py-3 bg-gradient-to-r from-background via-secondary/30 to-background border-b border-border/30">
        <BrandingBanner section="job_seeker" />
      </div>
      
      {/* Header */}
      <header className="relative z-10 p-4 glass">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">{t('findJobs')}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              {userLocation && <Navigation className="w-3 h-3" />}
              {filteredSalons.length} {t('openingsNearYou')}
            </p>
          </div>
          <div className="flex items-center gap-3 relative">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-2 bg-yellow-500 text-black hover:bg-yellow-600 font-bold"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm">{t('language')}</span>
            </Button>
            {showLanguageMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-black border-2 border-yellow-500 rounded-lg shadow-2xl z-50">
                {[
                  { code: 'en' as const, name: 'English' },
                  { code: 'hi' as const, name: 'हिन्दी' },
                  { code: 'te' as const, name: 'తెలుగు' },
                ].map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code)
                      setShowLanguageMenu(false)
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-yellow-500/20 hover:text-yellow-500 transition-all text-sm font-medium text-white border-b border-white/10 last:border-b-0"
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => goToStep('profile')}
              className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
            >
              <User className="w-5 h-5 text-primary" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={t('searchJobsSalonsRoles')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-12 pr-12 bg-secondary/50 border-border/50"
          />
          <button 
            onClick={() => setShowFilterModal(true)}
            className={`absolute right-4 top-1/2 -translate-y-1/2 ${activeFiltersCount > 0 ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Filter className="w-5 h-5" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-sm font-bold rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
        
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {['All', 'Hair', 'Makeup', 'Nails', 'Spa', 'Beauty', 'Barber'].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm rounded-full whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Active Filters */}
        {(areaFilter || selectedRole !== 'All') && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {areaFilter && (
              <span className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/20 text-primary rounded-full">
                <MapPin className="w-3 h-3" />
                {areaFilter}
                <button onClick={() => setAreaFilter('')} className="ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedRole !== 'All' && (
              <span className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/20 text-primary rounded-full">
                <Briefcase className="w-3 h-3" />
                {selectedRole}
                <button onClick={() => setSelectedRole('All')} className="ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </header>
      
      {/* Subscription Status Banner */}
      {isApproved && viewStats.total !== 0 && (
        <div className="relative z-10 mx-4 mt-3 p-3 glass-card rounded-xl border border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">
                {viewStats.remaining === 'unlimited' 
                  ? 'Unlimited views' 
                  : `${viewStats.remaining}/${viewStats.total} views left`
                }
              </span>
            </div>
            {viewStats.remaining !== 'unlimited' && typeof viewStats.remaining === 'number' && viewStats.remaining <= 3 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => goToStep('subscription')}
                className="text-xs h-7"
              >
                Upgrade
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Info Banner for non-subscribed */}
      {!isApproved && (
        <div className="relative z-10 mx-4 mt-3 p-3 glass-card rounded-xl border border-accent/20">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Subscribe to unlock</h3>
              <p className="text-xs text-muted-foreground">
                View salon contacts, chat with owners, and apply to jobs
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Sort Options */}
      <div className="relative z-10 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{filteredSalons.length} jobs</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-transparent text-foreground font-medium focus:outline-none cursor-pointer"
          >
            <option value="distance">Nearest</option>
            <option value="salary">Highest Pay</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>
      
      {/* Salon List */}
      <div className="relative z-10 flex-1 px-4 overflow-y-auto">
        <div className="space-y-3 pb-4">
          {filteredSalons.map((salon, index) => {
            const isUnlocked = unlockedSalons.has(salon.id)
            
            return (
              <button
                key={salon.id}
                onClick={() => handleSalonClick(salon)}
                className="w-full p-4 glass-card rounded-xl text-left transition-all duration-300 hover:scale-[1.01] animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Salon Avatar */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                    isUnlocked ? 'bg-primary/20' : 'bg-secondary/80'
                  }`}>
                    <Building2 className={`w-7 h-7 ${isUnlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  
                  {/* Salon Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-base">{salon.name}</h3>
                        {salon.job && (
                          <p className="text-sm text-primary font-medium">{salon.job.role}</p>
                        )}
                      </div>
                      {isUnlocked ? (
                        <Unlock className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    
                    {/* Quick Info */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {salon.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          {salon.rating}
                        </span>
                      )}
                      {salon.distance !== undefined && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {salon.distance.toFixed(1)} km
                        </span>
                      )}
                      {/* Show phone status */}
                      <span className={`flex items-center gap-1 ${isApproved ? 'text-green-500' : 'text-muted-foreground'}`}>
                        <Phone className="w-3 h-3" />
                        {isApproved ? 'Contact visible' : <span className="blur-sm">Phone hidden</span>}
                      </span>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {salon.job && (
                        <>
                          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500">
                            {salon.job.salary}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-secondary/50 text-muted-foreground">
                            {salon.job.experience}
                          </span>
                          {salon.job.accommodation && (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-500">
                              Stay
                            </span>
                          )}
                          {salon.job.foodProvided && (
                            <span className="px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-500">
                              Food
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        
        {filteredSalons.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No jobs found</h3>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('All')
                setSelectedRole('All')
                setAreaFilter('')
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
      
      {/* Unlock CTA */}
      {!isApproved && (
        <div className="relative z-10 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <Button
            onClick={() => goToStep('subscription')}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gold-glow"
          >
            <Unlock className="w-5 h-5 mr-2" />
            Subscribe to Apply
          </Button>
        </div>
      )}
      
      {/* Modals */}
      {/* Unlock Prompt */}
      {showUnlockPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 glass-card rounded-2xl animate-scale-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">Content Locked</h3>
              <p className="text-muted-foreground mb-6">
                Subscribe to view contact details and apply to this job
              </p>
              <div className="flex gap-3 w-full">
                <Button variant="outline" onClick={() => setShowUnlockPrompt(false)} className="flex-1 h-12">
                  Later
                </Button>
                <Button onClick={() => { setShowUnlockPrompt(false); goToStep('subscription') }} className="flex-1 h-12 bg-primary">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Limit Reached */}
      {showLimitReached && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 glass-card rounded-2xl animate-scale-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                <Crown className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">View Limit Reached</h3>
              <p className="text-muted-foreground mb-6">
                Upgrade your plan to view more salons
              </p>
              <div className="flex gap-3 w-full">
                <Button variant="outline" onClick={() => setShowLimitReached(false)} className="flex-1 h-12">
                  Cancel
                </Button>
                <Button onClick={() => { setShowLimitReached(false); goToStep('subscription') }} className="flex-1 h-12 bg-primary">
                  Upgrade
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Salon Details Modal */}
      {selectedSalon && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 glass-card rounded-t-3xl animate-slide-up max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedSalon(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedSalon.name}</h2>
                {selectedSalon.job && (
                  <p className="text-primary font-medium">{selectedSalon.job.role}</p>
                )}
                {selectedSalon.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-medium">{selectedSalon.rating}</span>
                    <span className="text-xs text-muted-foreground">({selectedSalon.reviewCount} reviews)</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Job Details */}
            {selectedSalon.job && (
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-secondary/30 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs">Salary</span>
                    </div>
                    <p className="font-semibold text-sm">{selectedSalon.job.salary}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-xs">Experience</span>
                    </div>
                    <p className="font-semibold text-sm">{selectedSalon.job.experience}</p>
                  </div>
                </div>
                
                <div className="p-3 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs">Location</span>
                  </div>
                  <p className="font-semibold text-sm">
                    {selectedSalon.job.location.address}, {selectedSalon.job.location.area}
                  </p>
                  {selectedSalon.distance !== undefined && (
                    <p className="text-xs text-primary mt-1">{selectedSalon.distance.toFixed(1)} km from you</p>
                  )}
                </div>
                
                {selectedSalon.job.timing && (
                  <div className="p-3 bg-secondary/30 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">Timing</span>
                    </div>
                    <p className="font-semibold text-sm">{selectedSalon.job.timing}</p>
                  </div>
                )}
                
                {/* Benefits */}
                <div className="flex flex-wrap gap-2">
                  {selectedSalon.job.accommodation && (
                    <span className="px-3 py-1.5 text-xs rounded-full bg-blue-500/20 text-blue-500 font-medium">
                      Accommodation Provided
                    </span>
                  )}
                  {selectedSalon.job.foodProvided && (
                    <span className="px-3 py-1.5 text-xs rounded-full bg-orange-500/20 text-orange-500 font-medium">
                      Food Provided
                    </span>
                  )}
                  {selectedSalon.job.gender && selectedSalon.job.gender !== 'any' && (
                    <span className="px-3 py-1.5 text-xs rounded-full bg-purple-500/20 text-purple-500 font-medium">
                      {selectedSalon.job.gender === 'female' ? 'Female Only' : 'Male Only'}
                    </span>
                  )}
                </div>
                
                {/* Contact - Blurred for non-subscribers */}
                {isApproved ? (
                  <div className="p-3 bg-primary/10 rounded-xl border border-primary/30">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <Phone className="w-4 h-4" />
                      <span className="text-xs font-medium">Contact Number</span>
                    </div>
                    <p className="font-bold text-lg">{selectedSalon.ownerPhone || 'Not provided'}</p>
                  </div>
                ) : (
                  <div className="p-3 bg-secondary/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Lock className="w-4 h-4" />
                      <span className="text-xs font-medium">Contact Number</span>
                    </div>
                    <p className="font-bold text-lg blur-md select-none">+91 98765 43210</p>
                    <p className="text-xs text-accent mt-2">Subscribe for Rs.99 to unlock contact</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-3">
              {isApproved ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => {
                      const phone = selectedSalon.ownerPhone?.replace(/\D/g, '')
                      if (phone) {
                        window.open(`tel:+91${phone}`, '_blank')
                      }
                    }}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  <Button
                    className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                    onClick={() => setShowMessageModal(true)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full h-12 bg-primary hover:bg-primary/90"
                  onClick={() => { setSelectedSalon(null); goToStep('subscription') }}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Subscribe for Rs.99 to Contact
                </Button>
              )}
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
                <h3 className="text-xl font-bold mb-2">Opening WhatsApp</h3>
                <p className="text-muted-foreground">Message ready to send!</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-4">Message {selectedSalon.name}</h3>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Hi! I am interested in this position. I have experience in..."
                  className="w-full h-32 p-3 bg-secondary/50 border border-border/50 rounded-xl resize-none focus:outline-none focus:border-primary"
                />
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" onClick={() => { setShowMessageModal(false); setMessageText('') }} className="flex-1 h-12">
                    Cancel
                  </Button>
                  <Button onClick={handleSendMessage} disabled={!messageText.trim()} className="flex-1 h-12 bg-green-600 hover:bg-green-700">
                    <Send className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 glass-card rounded-t-3xl animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Filter Jobs</h3>
              <button onClick={() => setShowFilterModal(false)} className="p-2 hover:bg-secondary/50 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Role Filter */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Job Role</label>
              <div className="max-h-40 overflow-y-auto space-y-1 p-2 bg-secondary/20 rounded-xl">
                <button
                  onClick={() => setSelectedRole('All')}
                  className={`w-full px-3 py-2 text-sm rounded-lg text-left transition-all ${
                    selectedRole === 'All' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                  }`}
                >
                  All Roles
                </button>
                {BEAUTY_ROLES.slice(0, 15).map(({ role }) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full px-3 py-2 text-sm rounded-lg text-left transition-all ${
                      selectedRole === role ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Area Filter */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Enter area or city..."
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="h-12 pl-12 bg-secondary/50"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {['Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield', 'Jayanagar', 'BTM Layout'].map(area => (
                  <button
                    key={area}
                    onClick={() => setAreaFilter(area)}
                    className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                      areaFilter === area ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory('All')
                  setSelectedRole('All')
                  setAreaFilter('')
                  setShowFilterModal(false)
                }}
                className="flex-1 h-12"
              >
                Clear All
              </Button>
              <Button onClick={() => setShowFilterModal(false)} className="flex-1 h-12 bg-primary">
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
