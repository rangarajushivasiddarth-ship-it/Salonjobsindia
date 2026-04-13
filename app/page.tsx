'use client'

import { AppProvider, useApp } from '@/lib/app-context'
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

function CustomerApp() {
  const { currentStep, signIn, signUp, setRole, goToStep, isLoading } = useApp()

  // Show loading while checking auth
  if (isLoading && currentStep === 'splash') {
    return (
      <SplashScreen
        onFindJob={() => {}}
        onCreateAlert={() => {}}
      />
    )
  }

  const renderScreen = () => {
    switch (currentStep) {
      case 'splash':
        return (
          <SplashScreen
            onFindJob={() => goToStep('auth')}
            onCreateAlert={() => goToStep('auth')}
          />
        )
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
      default:
        return (
          <SplashScreen
            onFindJob={() => goToStep('auth')}
            onCreateAlert={() => goToStep('auth')}
          />
        )
    }
  }

  return <>{renderScreen()}</>
}

export default function Home() {
  return (
    <AppProvider>
      <main className="min-h-screen">
        <CustomerApp />
      </main>
    </AppProvider>
  )
}
