'use client'

import { useState, useMemo } from 'react'
import { Building2, ArrowLeft, ArrowRight, Briefcase } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language-context'
import { useTranslation } from '@/lib/use-translation'
import type { UserRole } from '@/lib/types'

interface RoleSelectionProps {
  onSelect: (role: UserRole) => void
  onBack: () => void
}

export function RoleSelection({ onSelect, onBack }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const { currentLanguage } = useLanguage()
  const { t } = useTranslation()

  const roles = useMemo(() => [
    {
      id: 'job_seeker' as UserRole,
      title: t('role.jobSeeker'),
      description: t('role.jobSeekerDesc'),
      icon: Briefcase,
      features: [
        t('role.jobSeekerFeature1'),
        t('role.jobSeekerFeature2'),
        t('role.jobSeekerFeature3'),
      ],
    },
    {
      id: 'employer' as UserRole,
      title: t('role.salonOwner'),
      description: t('role.salonOwnerDesc'),
      icon: Building2,
      features: [
        t('role.salonOwnerFeature1'),
        t('role.salonOwnerFeature2'),
        t('role.salonOwnerFeature3'),
      ],
    },
  ], [t, currentLanguage])

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      
      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </header>
      
      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pb-8">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6 animate-scale-in">
          <div className="relative w-36 h-36">
            <Image
              src="/images/logo.png"
              alt="Salon Jobs India"
              fill
              className="object-contain"
            />
          </div>
        </div>
        
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 animate-slide-up">
            {t('selectRole')}
          </h1>
          <p className="text-muted-foreground animate-slide-up" style={{ animationDelay: '100ms' }}>
            {t('selectRoleDesc')}
          </p>
        </div>
        
        {/* Role Cards */}
        <div className="flex-1 flex flex-col gap-4 max-w-md mx-auto w-full">
          {roles.map((role, index) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`relative p-6 rounded-2xl text-left transition-all duration-300 animate-slide-up ${
                selectedRole === role.id
                  ? 'glass-card gold-glow scale-[1.02]'
                  : 'glass-card hover:scale-[1.01] opacity-80 hover:opacity-100'
              }`}
              style={{ animationDelay: `${150 + index * 100}ms` }}
            >
              {/* Selection indicator */}
              <div 
                className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                  selectedRole === role.id 
                    ? 'border-primary bg-primary' 
                    : 'border-muted-foreground/50'
                }`}
              >
                {selectedRole === role.id && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>
              
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl mb-4 flex items-center justify-center transition-all duration-300 ${
                selectedRole === role.id ? 'bg-primary/20' : 'bg-secondary/50'
              }`}>
                <role.icon className={`w-7 h-7 transition-colors duration-300 ${
                  selectedRole === role.id ? 'text-primary' : 'text-muted-foreground'
                }`} />
              </div>
              
              {/* Title & Description */}
              <h3 className="text-xl font-semibold mb-1">{role.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
              
              {/* Features */}
              <ul className="space-y-2">
                {role.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                      selectedRole === role.id ? 'bg-primary' : 'bg-muted-foreground/50'
                    }`} />
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
        
        {/* Continue Button */}
        <div className="mt-8 max-w-md mx-auto w-full animate-slide-up" style={{ animationDelay: '350ms' }}>
          <Button
            onClick={() => selectedRole && onSelect(selectedRole)}
            disabled={!selectedRole}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gold-glow transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {t('next')}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
      
    </div>
  )
}
