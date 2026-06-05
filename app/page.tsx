'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { AppProvider, useApp } from '@/lib/app-context'
import { LanguageProvider } from '@/lib/language-context'
import { ErrorBoundary } from '@/components/error-boundary'

// Dynamically import all components with no SSR to prevent hydration mismatches
const SplashScreen = dynamic(() => import('@/components/customer/splash-screen').then(mod => ({ default: mod.SplashScreen })), { ssr: false, loading: () => null })
const AuthScreen = dynamic(() => import('@/components/customer/auth-screen').then(mod => ({ default: mod.AuthScreen })), { ssr: false })
const RoleSelection = dynamic(() => import('@/components/customer/role-selection').then(mod => ({ default: mod.RoleSelection })), { ssr: false })
const ResumeBuilder = dynamic(() => import('@/components/customer/resume-builder').then(mod => ({ default: mod.ResumeBuilder })), { ssr: false })
const JobDiscovery = dynamic(() => import('@/components/customer/job-discovery').then(mod => ({ default: mod.JobDiscovery })), { ssr: false })
const SubscriptionScreen = dynamic(() => import('@/components/customer/subscription-screen').then(mod => ({ default: mod.SubscriptionScreen })), { ssr: false })
const JobResults = dynamic(() => import('@/components/customer/job-results').then(mod => ({ default: mod.JobResults })), { ssr: false })
const ProfileDashboard = dynamic(() => import('@/components/customer/profile-dashboard').then(mod => ({ default: mod.ProfileDashboard })), { ssr: false })
const CreateJob = dynamic(() => import('@/components/customer/create-job').then(mod => ({ default: mod.CreateJob })), { ssr: false })
const OwnerPanel = dynamic(() => import('@/components/customer/owner-panel').then(mod => ({ default: mod.OwnerPanel })), { ssr: false })
const MessagesScreen = dynamic(() => import('@/components/customer/messages-screen').then(mod => ({ default: mod.MessagesScreen })), { ssr: false })
const NotificationsScreen = dynamic(() => import('@/components/customer/notifications-screen').then(mod => ({ default: mod.NotificationsScreen })), { ssr: false })
const SettingsScreen = dynamic(() => import('@/components/customer/settings-screen').then(mod => ({ default: mod.SettingsScreen })), { ssr: false })
const AboutUsScreen = dynamic(() => import('@/components/customer/about-us-screen').then(mod => ({ default: mod.AboutUsScreen })), { ssr: false })
const ContactUsScreen = dynamic(() => import('@/components/customer/contact-us-screen').then(mod => ({ default: mod.ContactUsScreen })), { ssr: false })
const CreditPayment = dynamic(() => import('@/components/customer/credit-payment').then(mod => ({ default: mod.CreditPayment })), { ssr: false })
const SalonProfileSetup = dynamic(() => import('@/components/customer/salon-profile-setup').then(mod => ({ default: mod.SalonProfileSetup })), { ssr: false })
const BottomNav = dynamic(() => import('@/components/customer/bottom-nav').then(mod => ({ default: mod.BottomNav })), { ssr: false })

function CustomerApp() {
  const { currentStep, signIn, signUp, setRole, goToStep } = useApp()

  // Show splash screen first, then proceed (no mounted state needed with ssr: false)
  if (currentStep === 'splash') {
    return (
      <SplashScreen
        onComplete={() => goToStep('auth')}
      />
    )
  }

  const renderScreen = () => {
    const screen = (() => {
      switch (currentStep) {
        case 'auth':
          return (
            <AuthScreen
              onSignIn={signIn}
              onSignUp={signUp}
              onBack={() => goToStep('splash')}
            />
          )
        case 'role':
          return (
            <RoleSelection
              onSelect={(role) => setRole(role)}
              onBack={() => goToStep('auth')}
            />
          )
        case 'resume':
          return <ResumeBuilder />
        case 'discovery':
          return <JobDiscovery />
        case 'subscription':
          return <SubscriptionScreen />
        case 'results':
          return <JobResults />
        case 'profile':
          return <ProfileDashboard />
        case 'create-job':
          return <CreateJob />
        case 'owner-panel':
          return <OwnerPanel />
        case 'messages':
          return <MessagesScreen />
        case 'notifications':
          return <NotificationsScreen />
        case 'settings':
          return <SettingsScreen />
        case 'about':
          return <AboutUsScreen />
        case 'contact':
          return <ContactUsScreen />
        case 'credit-payment':
          return <CreditPayment />
        case 'salon-profile':
          return <SalonProfileSetup />
        default:
          return (
            <AuthScreen
              onSignIn={signIn}
              onSignUp={signUp}
              onBack={() => goToStep('auth')}
            />
          )
      }
    })()
    
    return <div className="w-full h-screen overflow-auto">{screen}</div>
  }

  // Show bottom nav only on main app screens (not auth flow)
  const showBottomNav = ['discovery', 'results', 'messages', 'notifications', 'profile', 'owner-panel', 'create-job', 'about', 'contact'].includes(currentStep)
  
  return (
    <>
      {renderScreen()}
      {showBottomNav && <BottomNav unreadMessages={2} unreadNotifications={3} />}
    </>
  )
}

export default function Home() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AppProvider>
          <main className="min-h-screen">
            <CustomerApp />
          </main>
        </AppProvider>
      </LanguageProvider>
    </ErrorBoundary>
  )
}
