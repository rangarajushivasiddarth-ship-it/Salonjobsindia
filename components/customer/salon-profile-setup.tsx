'use client'

import { useState, useRef } from 'react'
import { Building2, User, Phone, Mail, MapPin, Clock, FileText, Camera, X, Navigation, ChevronRight, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/lib/app-context'
import { saveSalonProfile } from '@/lib/data-store'
import type { SalonProfile } from '@/lib/types'

// Indian states
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry'
]

export function SalonProfileSetup() {
  const { user, goToStep } = useApp()
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [showStateDropdown, setShowStateDropdown] = useState(false)
  
  const [formData, setFormData] = useState({
    salonName: '',
    ownerName: user?.name || '',
    mobile: user?.phone || '',
    email: user?.email || '',
    logoUrl: '',
    address: '',
    state: '',
    city: '',
    area: '',
    locality: '',
    workingHours: '10:00 AM - 8:00 PM',
    description: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, logo: 'Please upload JPG, JPEG, PNG or WEBP file' }))
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logo: 'File size should be less than 5MB' }))
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setLogoPreview(result)
        setFormData(prev => ({ ...prev, logoUrl: result }))
        setErrors(prev => ({ ...prev, logo: '' }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoPreview(null)
    setFormData(prev => ({ ...prev, logoUrl: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setErrors(prev => ({ ...prev, location: 'Geolocation is not supported by your browser' }))
      return
    }

    setIsDetectingLocation(true)
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      })

      const { latitude, longitude } = position.coords
      
      // Reverse geocoding using Nominatim (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      )
      const data = await response.json()
      
      if (data.address) {
        setFormData(prev => ({
          ...prev,
          address: data.display_name || '',
          state: data.address.state || '',
          city: data.address.city || data.address.town || data.address.village || '',
          area: data.address.suburb || data.address.neighbourhood || '',
          locality: data.address.road || data.address.locality || '',
        }))
      }
    } catch {
      setErrors(prev => ({ ...prev, location: 'Unable to detect location. Please enter manually.' }))
    } finally {
      setIsDetectingLocation(false)
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.salonName.trim()) newErrors.salonName = 'Salon name is required'
    if (!formData.ownerName.trim()) newErrors.ownerName = 'Owner name is required'
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required'
    else if (!/^[6-9]\d{9}$/.test(formData.mobile.replace(/\D/g, ''))) {
      newErrors.mobile = 'Enter valid 10-digit mobile number'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter valid email address'
    }
    if (!formData.state.trim()) newErrors.state = 'State is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (!formData.area.trim()) newErrors.area = 'Area is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    if (!user) return

    setIsLoading(true)
    
    try {
      const profile: SalonProfile = {
        id: crypto.randomUUID(),
        ownerId: user.id,
        salonName: formData.salonName,
        ownerName: formData.ownerName,
        mobile: formData.mobile,
        email: formData.email || undefined,
        logoUrl: formData.logoUrl || undefined,
        address: formData.address || `${formData.locality}, ${formData.area}, ${formData.city}, ${formData.state}`,
        state: formData.state,
        city: formData.city,
        area: formData.area,
        locality: formData.locality,
        workingHours: formData.workingHours,
        description: formData.description || undefined,
        isVerified: false,
        contactCredits: 0,
        unlockedCandidates: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      saveSalonProfile(profile)
      goToStep('create-job')
    } catch (error) {
      console.error('Error saving profile:', error)
      setErrors(prev => ({ ...prev, submit: 'Failed to save profile. Please try again.' }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-primary/10 to-transparent" />
      
      {/* Header */}
      <header className="relative z-10 p-4 pt-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center gold-glow">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Complete Your Salon Profile</h1>
            <p className="text-sm text-muted-foreground">Set up your salon to start posting jobs</p>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="relative z-10 flex-1 px-4 pb-32 overflow-y-auto">
        <div className="space-y-6">
          
          {/* Logo Upload */}
          <div className="p-4 glass-card rounded-2xl">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              Salon Logo (Optional)
            </h3>
            
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative">
                  <img 
                    src={logoPreview} 
                    alt="Salon logo" 
                    className="w-20 h-20 rounded-xl object-cover border-2 border-primary/30"
                  />
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-[10px] text-muted-foreground">Upload</span>
                </div>
              )}
              
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Upload your salon logo. Accepted formats: JPG, PNG, WEBP. Max 5MB.
                </p>
                {!logoPreview && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                )}
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
            />
            
            {errors.logo && (
              <p className="text-sm text-destructive mt-2">{errors.logo}</p>
            )}
          </div>

          {/* Basic Info */}
          <div className="p-4 glass-card rounded-2xl space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Basic Information
            </h3>
            
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Salon Name *</label>
              <Input
                placeholder="Enter your salon name"
                value={formData.salonName}
                onChange={(e) => handleChange('salonName', e.target.value)}
                className={`h-12 bg-secondary/30 border-border/50 ${errors.salonName ? 'border-destructive' : ''}`}
              />
              {errors.salonName && <p className="text-xs text-destructive mt-1">{errors.salonName}</p>}
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Owner Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Enter owner name"
                  value={formData.ownerName}
                  onChange={(e) => handleChange('ownerName', e.target.value)}
                  className={`h-12 pl-11 bg-secondary/30 border-border/50 ${errors.ownerName ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.ownerName && <p className="text-xs text-destructive mt-1">{errors.ownerName}</p>}
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Salon Mobile Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className={`h-12 pl-11 bg-secondary/30 border-border/50 ${errors.mobile ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.mobile && <p className="text-xs text-destructive mt-1">{errors.mobile}</p>}
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Email (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`h-12 pl-11 bg-secondary/30 border-border/50 ${errors.email ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Location */}
          <div className="p-4 glass-card rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Location
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={detectLocation}
                disabled={isDetectingLocation}
                className="text-primary border-primary/30"
              >
                <Navigation className="w-4 h-4 mr-1" />
                {isDetectingLocation ? 'Detecting...' : 'Auto Detect'}
              </Button>
            </div>
            
            {errors.location && (
              <p className="text-sm text-amber-500">{errors.location}</p>
            )}

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">State *</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowStateDropdown(!showStateDropdown)}
                  className={`w-full h-12 px-4 bg-secondary/30 border border-border/50 rounded-md text-left flex items-center justify-between ${errors.state ? 'border-destructive' : ''}`}
                >
                  <span className={formData.state ? 'text-foreground' : 'text-muted-foreground'}>
                    {formData.state || 'Select state'}
                  </span>
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showStateDropdown ? 'rotate-90' : ''}`} />
                </button>
                
                {showStateDropdown && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-card border border-border rounded-lg shadow-lg">
                    {INDIAN_STATES.map(state => (
                      <button
                        key={state}
                        type="button"
                        onClick={() => {
                          handleChange('state', state)
                          setShowStateDropdown(false)
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors text-sm"
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.state && <p className="text-xs text-destructive mt-1">{errors.state}</p>}
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">City *</label>
              <Input
                placeholder="Enter city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className={`h-12 bg-secondary/30 border-border/50 ${errors.city ? 'border-destructive' : ''}`}
              />
              {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Area *</label>
              <Input
                placeholder="Enter area/suburb"
                value={formData.area}
                onChange={(e) => handleChange('area', e.target.value)}
                className={`h-12 bg-secondary/30 border-border/50 ${errors.area ? 'border-destructive' : ''}`}
              />
              {errors.area && <p className="text-xs text-destructive mt-1">{errors.area}</p>}
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Locality/Street (Optional)</label>
              <Input
                placeholder="Enter locality or street"
                value={formData.locality}
                onChange={(e) => handleChange('locality', e.target.value)}
                className="h-12 bg-secondary/30 border-border/50"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Full Address (Optional)</label>
              <textarea
                placeholder="Enter complete address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-secondary/30 border border-border/50 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Additional Info */}
          <div className="p-4 glass-card rounded-2xl space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Additional Information
            </h3>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Working Hours</label>
              <Input
                placeholder="e.g., 10:00 AM - 8:00 PM"
                value={formData.workingHours}
                onChange={(e) => handleChange('workingHours', e.target.value)}
                className="h-12 bg-secondary/30 border-border/50"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Salon Description (Optional)
              </label>
              <textarea
                placeholder="Tell job seekers about your salon..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-secondary/30 border border-border/50 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {errors.submit && (
            <p className="text-sm text-destructive text-center">{errors.submit}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8 z-20">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-semibold gold-glow"
        >
          {isLoading ? 'Saving...' : 'Continue to Create Job'}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}
