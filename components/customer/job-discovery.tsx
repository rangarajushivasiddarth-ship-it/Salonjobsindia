'use client'

import { useState } from 'react'
import { Search, Lock, MapPin, Building2, User, Unlock, Filter, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApp } from '@/lib/app-context'

// Mock salon data (names only - details locked)
const MOCK_SALONS = [
  { id: '1', name: 'Glamour Studio' },
  { id: '2', name: 'Style Haven' },
  { id: '3', name: 'Beauty Bliss' },
  { id: '4', name: 'Chic Cuts' },
  { id: '5', name: 'Luxe Salon' },
  { id: '6', name: 'Hair Artistry' },
  { id: '7', name: 'Elegant Touch' },
  { id: '8', name: 'Modern Mane' },
  { id: '9', name: 'Pristine Beauty' },
  { id: '10', name: 'Urban Styling' },
]

export function JobDiscovery() {
  const { user, goToStep } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false)

  const filteredSalons = MOCK_SALONS.filter(salon =>
    salon.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSalonClick = () => {
    setShowUnlockPrompt(true)
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
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
          <button className="absolute right-4 top-1/2 -translate-y-1/2">
            <Filter className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>
      
      {/* Info Banner */}
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
      
      {/* Salon List */}
      <div className="relative z-10 flex-1 p-4 overflow-y-auto">
        <div className="space-y-3">
          {filteredSalons.map((salon, index) => (
            <button
              key={salon.id}
              onClick={handleSalonClick}
              className="w-full p-4 glass-card rounded-xl text-left transition-all duration-300 hover:scale-[1.01] animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Salon Avatar */}
                  <div className="w-14 h-14 rounded-xl bg-secondary/80 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-primary" />
                  </div>
                  
                  {/* Salon Info */}
                  <div>
                    <h3 className="font-semibold text-lg">{salon.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="blur-sm select-none">Location hidden</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Lock Icon */}
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
              
              {/* Blurred Details */}
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="flex gap-3">
                  <span className="px-3 py-1 text-xs rounded-full bg-secondary/50 text-muted-foreground blur-sm select-none">
                    Role hidden
                  </span>
                  <span className="px-3 py-1 text-xs rounded-full bg-secondary/50 text-muted-foreground blur-sm select-none">
                    Salary hidden
                  </span>
                </div>
              </div>
            </button>
          ))}
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
      <div className="relative z-10 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={() => goToStep('subscription')}
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gold-glow transition-all duration-300 hover:scale-[1.02]"
        >
          <Unlock className="w-5 h-5 mr-2" />
          Unlock Full Details
        </Button>
      </div>
      
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
    </div>
  )
}
