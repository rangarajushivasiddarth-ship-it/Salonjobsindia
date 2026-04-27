'use client'

import { Home, Search, MessageCircle, Bell, User } from 'lucide-react'
import { useApp } from '@/lib/app-context'

type NavItem = {
  id: string
  label: string
  icon: typeof Home
  step: 'discovery' | 'results' | 'messages' | 'notifications' | 'profile'
  badge?: number
}

interface BottomNavProps {
  unreadMessages?: number
  unreadNotifications?: number
}

export function BottomNav({ unreadMessages = 0, unreadNotifications = 0 }: BottomNavProps) {
  const { currentStep, goToStep, user } = useApp()
  
  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home, step: user?.isSubscribed ? 'results' : 'discovery' },
    { id: 'search', label: 'Search', icon: Search, step: 'discovery' },
    { id: 'messages', label: 'Messages', icon: MessageCircle, step: 'messages', badge: unreadMessages },
    { id: 'notifications', label: 'Alerts', icon: Bell, step: 'notifications', badge: unreadNotifications },
    { id: 'profile', label: 'Profile', icon: User, step: 'profile' },
  ]
  
  const isActive = (item: NavItem) => {
    if (item.id === 'home') {
      return currentStep === 'discovery' || currentStep === 'results'
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
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              
              {/* Label */}
              <span className={`text-[10px] mt-1 font-medium ${active ? 'text-primary' : ''}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
