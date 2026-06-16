'use client'

import { useMemo } from 'react'
import { Home, Search, MessageCircle, Bell, User, Briefcase, Building2, Info, Phone } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { useTranslation } from '@/lib/use-translation'
import { useLanguage } from '@/lib/language-context'

type NavItem = {
  id: string
  label: string
  icon: typeof Home
  step: 'discovery' | 'results' | 'messages' | 'notifications' | 'profile' | 'owner-panel' | 'create-job' | 'about' | 'contact'
  badge?: number
}

interface BottomNavProps {
  unreadMessages?: number
  unreadNotifications?: number
}

export function BottomNav({ unreadMessages = 0, unreadNotifications = 0 }: BottomNavProps) {
  const { currentStep, goToStep, user } = useApp()
  const { t } = useTranslation()
  const { currentLanguage } = useLanguage()
  
  const isOwner = user?.role === 'salon_owner' || user?.role === 'employer'
  
  // Memoize nav items so they re-render when language changes
  const jobSeekerNav: NavItem[] = useMemo(() => [
    { id: 'home', label: t('findJobs'), icon: Home, step: 'discovery' }, // Job seekers always have access
    { id: 'about', label: t('about'), icon: Info, step: 'about' },
    { id: 'contact', label: t('contact'), icon: Phone, step: 'contact' },
    { id: 'messages', label: t('messages'), icon: MessageCircle, step: 'messages', badge: unreadMessages },
    { id: 'profile', label: t('profile'), icon: User, step: 'profile' },
  ], [t, unreadMessages, currentLanguage])
  
  const salonOwnerNav: NavItem[] = useMemo(() => [
    { id: 'home', label: t('dashboard'), icon: Building2, step: 'owner-panel' },
    { id: 'post', label: t('postJob'), icon: Briefcase, step: 'create-job' },
    { id: 'about', label: t('about'), icon: Info, step: 'about' },
    { id: 'contact', label: t('contact'), icon: Phone, step: 'contact' },
    { id: 'messages', label: t('messages'), icon: MessageCircle, step: 'messages', badge: unreadMessages },
    { id: 'profile', label: t('profile'), icon: User, step: 'profile' },
  ], [t, unreadMessages, currentLanguage])
  
  const navItems = isOwner ? salonOwnerNav : jobSeekerNav
  
  const isActive = (item: NavItem) => {
    if (item.id === 'home') {
      if (isOwner) {
        return currentStep === 'owner-panel'
      }
      return currentStep === 'discovery' || currentStep === 'results'
    }
    if (item.id === 'post') {
      return currentStep === 'create-job'
    }
    if (item.id === 'about') {
      return currentStep === 'about'
    }
    if (item.id === 'contact') {
      return currentStep === 'contact'
    }
    return currentStep === item.step
  }
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/30 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item)
          return (
            <button
              key={item.id}
              onClick={() => goToStep(item.step)}
              className={`relative flex flex-col items-center justify-center w-16 h-full transition-all duration-200 ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {/* Active indicator */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
              )}
              
              {/* Icon with badge */}
              <div className="relative">
                <item.icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
              {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold bg-destructive text-destructive-foreground rounded-full">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              
              {/* Label */}
              <span className={`text-sm mt-1 font-medium ${active ? 'text-primary' : ''}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
