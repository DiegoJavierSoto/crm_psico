import { create } from 'zustand'

export type View = 'landing' | 'login' | 'register' | 'forgot-password' | 'dashboard' | 'calendar' | 'patient-detail' | 'settings'

interface User {
  id: string
  email: string
  name: string
  phone?: string | null
  licenseNumber?: string | null
  specialty?: string | null
}

interface AppState {
  currentView: View
  selectedPatientId: string | null
  calendarDate: string
  sidebarOpen: boolean
  user: User | null
  isAuthenticated: boolean

  setView: (view: View) => void
  setSelectedPatientId: (id: string | null) => void
  setCalendarDate: (date: string) => void
  setSidebarOpen: (open: boolean) => void
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'landing',
  selectedPatientId: null,
  calendarDate: new Date().toISOString().split('T')[0],
  sidebarOpen: false,
  user: null,
  isAuthenticated: false,

  setView: (view) => set({ currentView: view }),
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),
  setCalendarDate: (date) => set({ calendarDate: date }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false, currentView: 'landing', selectedPatientId: null }),
}))
