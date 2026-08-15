'use client'

import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { useAuth } from '@/hooks/use-auth'
import { LandingPage } from '@/components/landing/landing-page'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { AppLayout } from '@/components/layout/app-layout'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { CalendarPage } from '@/components/calendar/calendar-page'
import { PatientDetailPage } from '@/components/patient/patient-detail-page'
import { SettingsPage } from '@/components/settings/settings-page'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppContent() {
  const { currentView, isAuthenticated } = useAppStore()
  const { checkAuth } = useAuth()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Unauthenticated views
  if (!isAuthenticated) {
    switch (currentView) {
      case 'login':
        return <LoginForm />
      case 'register':
        return <RegisterForm />
      case 'forgot-password':
        return <ForgotPasswordForm />
      default:
        return <LandingPage />
    }
  }

  // Authenticated views
  const renderView = () => {
    switch (currentView) {
      case 'calendar':
        return <CalendarPage />
      case 'patient-detail':
        return <PatientDetailPage />
      case 'settings':
        return <SettingsPage />
      case 'dashboard':
      default:
        return <DashboardPage />
    }
  }

  return (
    <AppLayout>
      {renderView()}
    </AppLayout>
  )
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
