'use client'

import { useState } from 'react'
import { QrCode, Navigation, FileText, Calendar, Save, Check, Upload, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdmin } from '@/lib/admin-context'
import { AdminSidebar } from './admin-sidebar'

export function AdminSettings() {
  const { settings, updateSettings } = useAdmin()
  const [localSettings, setLocalSettings] = useState(settings)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    updateSettings(localSettings)
    setIsSaving(false)
    setShowSuccess(true)
    
    setTimeout(() => setShowSuccess(false), 3000)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Configure app settings and payment options</p>
        </div>
        
        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 animate-slide-up">
            <Check className="w-5 h-5" />
            Settings saved successfully!
          </div>
        )}
        
        <div className="max-w-2xl space-y-6">
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
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 neon-glow"
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
    </div>
  )
}
