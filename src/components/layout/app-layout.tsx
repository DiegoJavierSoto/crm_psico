'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Bell,
  Settings,
  LogOut,
  Menu,
  Brain,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore, type View } from '@/store/app-store'
import { useAuth } from '@/hooks/use-auth'
import { useApi } from '@/hooks/use-api'
import { cn } from '@/lib/utils'
import { AlertsPanel } from '@/components/alerts/alerts-panel'

interface AlertItem {
  id: string
  type: string
  title: string
  message: string
  severity: string
  isRead: boolean
  createdAt: string
}

interface NavItem {
  icon: React.ElementType
  label: string
  view: View
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
  { icon: CalendarDays, label: 'Agenda', view: 'calendar' },
  { icon: Users, label: 'Pacientes', view: 'dashboard' },
  { icon: Bell, label: 'Alertas', view: 'dashboard' },
  { icon: Settings, label: 'Configuracion', view: 'settings' },
]

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const { currentView, setView, user } = useAppStore()
  const { logout } = useAuth()
  const { data: alerts } = useApi<AlertItem[]>('/api/alerts?isRead=false&isDismissed=false')
  const unreadCount = alerts?.filter((a) => !a.isRead).length || 0

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'PS'

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 h-16 border-b border-border/50">
        <Brain className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold text-foreground">PsicoCRM</span>
      </div>

      {/* Nav Items */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.view + item.label}
              onClick={() => {
                if (item.label === 'Pacientes') {
                  setView('dashboard')
                } else if (item.label === 'Alertas') {
                  setView('dashboard')
                } else {
                  setView(item.view)
                }
                onItemClick?.()
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                currentView === item.view && item.view !== 'dashboard'
                  ? 'bg-primary/10 text-primary'
                  : currentView === item.view && item.view === 'dashboard'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
              {item.label === 'Alertas' && unreadCount > 0 && (
                <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t border-border/50 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.name || 'Usuario'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || ''}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesion
        </Button>
      </div>
    </div>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [alertsOpen, setAlertsOpen] = useState(false)
  const { currentView, setView, setSidebarOpen, sidebarOpen } = useAppStore()
  const { data: alerts } = useApi<AlertItem[]>('/api/alerts?isRead=false&isDismissed=false')
  const unreadCount = alerts?.filter((a) => !a.isRead).length || 0

  const viewTitles: Record<View, string> = {
    landing: '',
    login: '',
    register: '',
    dashboard: 'Dashboard',
    calendar: 'Agenda',
    'patient-detail': 'Expediente',
    settings: 'Configuracion',
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col border-r border-border/50 bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent onItemClick={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-14 border-b border-border/50 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center h-full px-4 lg:px-6 gap-3">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2 flex-1">
              <h1 className="text-base font-semibold text-foreground">
                {viewTitles[currentView] || 'PsicoCRM'}
              </h1>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setAlertsOpen(true)}
                aria-label="Ver alertas"
              >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Alerts Panel */}
        <AlertsPanel open={alertsOpen} onOpenChange={setAlertsOpen} />

        {/* Page Content */}
        <motion.main
          key={currentView}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex-1 p-4 lg:p-6"
        >
          {children}
        </motion.main>

        {/* Footer */}
        <footer className="border-t border-border/50 py-4 mt-auto">
          <div className="px-4 lg:px-6 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} PsicoCRM
            </p>
            <p className="text-xs text-muted-foreground">
              Gestion clinica profesional
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
