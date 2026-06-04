'use client'

import { AppProvider, useApp } from '@/lib/app-context'
import { LanguageProvider } from '@/lib/language-context'
import { ErrorBoundary } from '@/components/error-boundary'
import { SplashScreen } from '@/components/customer/splash-screen'
import { AuthScreen } from '@/components/customer/auth-screen'
import { RoleSelection } from '@/components/customer/role-selection'
import { ResumeBuilder } from '@/components/customer/resume-builder'
import { JobDiscovery } from '@/components/customer/job-discovery'
import { SubscriptionScreen } from '@/components/customer/subscription-screen'
import { JobResults } from '@/components/customer/job-results'
import { ProfileDashboard } from '@/components/customer/profile-dashboard'
import { CreateJob } from '@/components/customer/create-job'
import { OwnerPanel } from '@/components/customer/owner-panel'
import { MessagesScreen } from '@/components/customer/messages-screen'
import { NotificationsScreen } from '@/components/customer/notifications-screen'
import { SettingsScreen } from '@/components/customer/settings-screen'
import { AboutUsScreen } from '@/components/customer/about-us-screen'
import { ContactUsScreen } from '@/components/customer/contact-us-screen'
import { CreditPayment } from '@/components/customer/credit-payment'
import { SalonProfileSetup } from '@/components/customer/salon-profile-setup'
import { BottomNav } from '@/components/customer/bottom-nav'

function CustomerApp() {
  const { currentStep, signIn, signUp, setRole, goToStep } = useApp()

  // Always show splash screen first, then proceed
  // Don't block on isLoading - let splash screen complete after timeout
  if (currentStep === 'splash') {
    return (
      <SplashScreen
        onComplete={() => goToStep('auth')}
      />
    )
  }

  const renderScreen = () => {
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
