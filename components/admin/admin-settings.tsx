'use client'

import { useState, useEffect, useRef } from 'react'
import { QrCode, Navigation, FileText, Calendar, Save, Check, Upload, Image, Trash2, Plus, X, ImageIcon } from 'lucide-react'
import NextImage from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdmin } from '@/lib/admin-context'
import { AdminSidebar } from './admin-sidebar'
import { getBrandingLogos, saveBrandingLogos } from '../customer/branding-banner'

interface BrandingLogo {
  id: string
  url: string
  alt: string
}

interface BrandingLogosConfig {
  job_seeker: BrandingLogo[]
  salon_owner: BrandingLogo[]
}

export function AdminSettings() {
  const { settings, updateSettings } = useAdmin()
  const [localSettings, setLocalSettings] = useState(settings)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Branding logos state
  const [brandingLogos, setBrandingLogos] = useState<BrandingLogosConfig>({
    job_seeker: [],
    salon_owner: []
  })
  const [activeSection, setActiveSection] = useState<'job_seeker' | 'salon_owner'>('job_seeker')
  const [showAddLogoModal, setShowAddLogoModal] = useState(false)
  const [newLogoUrl, setNewLogoUrl] = useState('')
  const [newLogoAlt, setNewLogoAlt] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load branding logos on mount
  useEffect(() => {
    const logos = getBrandingLogos()
    setBrandingLogos(logos)
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    updateSettings(localSettings)
    
    // Save branding logos
    saveBrandingLogos(brandingLogos)
    
    setIsSaving(false)
    setShowSuccess(true)
    
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleAddLogo = () => {
    if (!newLogoUrl.trim()) return
    
    const newLogo: BrandingLogo = {
      id: `logo-${Date.now()}`,
      url: newLogoUrl.trim(),
      alt: newLogoAlt.trim() || 'Brand Logo'
    }
    
    setBrandingLogos(prev => ({
      ...prev,
      [activeSection]: [...prev[activeSection], newLogo]
    }))
    
    setNewLogoUrl('')
    setNewLogoAlt('')
    setShowAddLogoModal(false)
  }

  const handleRemoveLogo = (logoId: string) => {
    setBrandingLogos(prev => ({
      ...prev,
      [activeSection]: prev[activeSection].filter(logo => logo.id !== logoId)
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Create a local URL for the uploaded file
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const newLogo: BrandingLogo = {
        id: `logo-${Date.now()}`,
        url: dataUrl,
        alt: file.name.replace(/\.[^/.]+$/, '') || 'Brand Logo'
      }
      
      setBrandingLogos(prev => ({
        ...prev,
        [activeSection]: [...prev[activeSection], newLogo]
      }))
    }
    reader.readAsDataURL(file)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Configure app settings, branding logos, and payment options</p>
        </div>
        
        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 animate-slide-up">
            <Check className="w-5 h-5" />
            Settings saved successfully!
          </div>
        )}
        
        <div className="max-w-2xl space-y-6">
          {/* Branding Logos Section */}
          <div className="p-6 glass-card rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Branding Logos</h2>
                <p className="text-sm text-muted-foreground">Manage scrolling banner logos for Job Seekers and Salon Owners</p>
              </div>
            </div>
            
            {/* Section Tabs */}
            <div className="flex gap-2 p-1 bg-secondary/30 rounded-xl mb-4">
              <button
                onClick={() => setActiveSection('job_seeker')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeSection === 'job_seeker'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Job Seeker Section
              </button>
              <button
                onClick={() => setActiveSection('salon_owner')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeSection === 'salon_owner'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Salon Owner Section
              </button>
            </div>
            
            {/* Logos Grid */}
            <div className="space-y-3 mb-4">
              {brandingLogos[activeSection].length === 0 ? (
                <div className="p-8 border-2 border-dashed border-border/50 rounded-xl text-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">No logos added yet</p>
                  <p className="text-xs text-muted-foreground">Add logos to display in the scrolling banner</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {brandingLogos[activeSection].map((logo) => (
                    <div
                      key={logo.id}
                      className="relative group p-3 bg-secondary/30 rounded-xl border border-border/30"
                    >
                      <div className="relative h-16 w-full mb-2">
                        {logo.url.startsWith('data:') || logo.url.startsWith('/') ? (
                          <NextImage
                            src={logo.url}
                            alt={logo.alt}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logo.url}
                            alt={logo.alt}
                            className="h-full w-full object-contain"
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate text-center">{logo.alt}</p>
                      <button
                        onClick={() => handleRemoveLogo(logo.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Add Logo Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddLogoModal(true)}
                className="flex-1 border-primary/50 text-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add URL
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 border-primary/50 text-primary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
          
          {/* QR Code Section */}
          <div className="p-6 glass-card rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Payment QR Code</h2>
                <p className="text-sm text-muted-foreground">Upload QR code for payment collection</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* QR Preview */}
              <div className="w-48 h-48 bg-foreground rounded-xl flex items-center justify-center shrink-0">
                <div className="text-background text-center">
                  <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-xs opacity-70">QR Code Preview</p>
                </div>
              </div>
              
              {/* Upload */}
              <div className="flex-1">
                <label className="block">
                  <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload new QR code</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                  <input type="file" accept="image/*" className="hidden" />
                </label>
              </div>
            </div>
          </div>
          
          {/* Radius Settings */}
          <div className="p-6 glass-card rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Navigation className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Search Radius</h2>
                <p className="text-sm text-muted-foreground">Maximum distance to show salons</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Radius (in kilometers)
                </label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={localSettings.radiusKm}
                    onChange={(e) => setLocalSettings(prev => ({ 
                      ...prev, 
                      radiusKm: parseInt(e.target.value) || 20 
                    }))}
                    className="w-32 h-12 bg-secondary/50 border-border/50 text-center text-lg font-semibold"
                    min={1}
                    max={100}
                  />
                  <span className="text-muted-foreground">km</span>
                </div>
              </div>
              
              {/* Radius Slider */}
              <div className="pt-2">
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={localSettings.radiusKm}
                  onChange={(e) => setLocalSettings(prev => ({ 
                    ...prev, 
                    radiusKm: parseInt(e.target.value) 
                  }))}
                  className="w-full h-2 bg-secondary/50 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>5 km</span>
                  <span>50 km</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Instructions */}
          <div className="p-6 glass-card rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Payment Instructions</h2>
                <p className="text-sm text-muted-foreground">Instructions shown to users during payment</p>
              </div>
            </div>
            
            <textarea
              value={localSettings.paymentInstructions}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                paymentInstructions: e.target.value 
              }))}
              rows={4}
              className="w-full px-4 py-3 bg-secondary/50 border border-border/50 rounded-xl focus:border-primary focus:outline-none resize-none"
              placeholder="Enter payment instructions..."
            />
          </div>
          
          {/* Subscription Duration */}
          <div className="p-6 glass-card rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Subscription Duration</h2>
                <p className="text-sm text-muted-foreground">How long subscriptions last</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={localSettings.subscriptionDurationDays}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  subscriptionDurationDays: parseInt(e.target.value) || 30 
                }))}
                className="w-32 h-12 bg-secondary/50 border-border/50 text-center text-lg font-semibold"
                min={1}
                max={365}
              />
              <span className="text-muted-foreground">days</span>
            </div>
          </div>
          
          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 gold-glow"
          >
            {isSaving ? (
              <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </main>
      
      {/* Add Logo Modal */}
      {showAddLogoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 glass-card rounded-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Add Logo URL</h3>
              <button
                onClick={() => setShowAddLogoModal(false)}
                className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Image URL
                </label>
                <Input
                  type="url"
                  value={newLogoUrl}
                  onChange={(e) => setNewLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="h-12 bg-secondary/50 border-border/50"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Alt Text (Optional)
                </label>
                <Input
                  type="text"
                  value={newLogoAlt}
                  onChange={(e) => setNewLogoAlt(e.target.value)}
                  placeholder="Brand name or description"
                  className="h-12 bg-secondary/50 border-border/50"
                />
              </div>
              
              {newLogoUrl && (
                <div className="p-4 bg-secondary/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <div className="h-16 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={newLogoUrl}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleAddLogo}
                disabled={!newLogoUrl.trim()}
                className="w-full h-12 bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Logo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
