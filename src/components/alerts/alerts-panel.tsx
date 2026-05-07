'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  X,
  AlertTriangle,
  Info,
  Clock,
  UserX,
  CalendarClock,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi, useApiMutation } from '@/hooks/use-api'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface AlertItem {
  id: string
  type: string
  title: string
  message: string
  severity: string
  isRead: boolean
  isDismissed: boolean
  createdAt: string
}

const alertIcons: Record<string, React.ElementType> = {
  APPOINTMENT_REMINDER: CalendarClock,
  INACTIVE_PATIENT: UserX,
  MISSED_SESSION: Clock,
  FOLLOW_UP_DUE: Bell,
  NO_SHOW: AlertTriangle,
}

const severityColors: Record<string, string> = {
  INFO: 'text-primary',
  WARNING: 'text-amber-500',
  URGENT: 'text-destructive',
}

const severityBgColors: Record<string, string> = {
  INFO: 'bg-primary/5',
  WARNING: 'bg-amber-50',
  URGENT: 'bg-destructive/5',
}

interface AlertsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AlertsPanel({ open, onOpenChange }: AlertsPanelProps) {
  const [filter, setFilter] = useState<string>('all')
  const { data: alerts, isLoading } = useApi<AlertItem[]>('/api/alerts')
  const markReadMutation = useApiMutation<AlertItem, { isRead: boolean }>()
  const dismissMutation = useApiMutation<AlertItem, { isDismissed: boolean }>()

  const filteredAlerts = alerts
    ?.filter((a) => !a.isDismissed)
    .filter((a) => filter === 'all' || a.severity === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || []

  const unreadCount = alerts?.filter((a) => !a.isRead && !a.isDismissed).length || 0

  const handleMarkRead = async (alertId: string) => {
    try {
      await markReadMutation.mutateAsync({
        url: `/api/alerts/${alertId}`,
        method: 'PATCH',
        body: { isRead: true },
      })
    } catch {
      // Silent error
    }
  }

  const handleDismiss = async (alertId: string) => {
    try {
      await dismissMutation.mutateAsync({
        url: `/api/alerts/${alertId}`,
        method: 'PATCH',
        body: { isDismissed: true },
      })
    } catch {
      // Silent error
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Alertas
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} sin leer
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Filter */}
        <div className="flex items-center gap-2">
          {['all', 'INFO', 'WARNING', 'URGENT'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'text-xs h-7',
                filter === f && 'bg-primary text-primary-foreground'
              )}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todas' :
               f === 'INFO' ? 'Info' :
               f === 'WARNING' ? 'Aviso' : 'Urgente'}
            </Button>
          ))}
        </div>

        <ScrollArea className="max-h-[50vh]">
          {isLoading ? (
            <div className="space-y-3 p-1">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mb-2 text-primary" />
              <p className="text-sm">No hay alertas pendientes</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2 p-1">
                {filteredAlerts.map((alert) => {
                  const Icon = alertIcons[alert.type] || Info
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'rounded-lg border border-border/50 p-3',
                        !alert.isRead && severityBgColors[alert.severity]
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', severityColors[alert.severity])} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn(
                              'text-sm font-medium',
                              !alert.isRead ? 'text-foreground' : 'text-muted-foreground'
                            )}>
                              {alert.title}
                            </p>
                            {!alert.isRead && (
                              <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {alert.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {format(parseISO(alert.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!alert.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleMarkRead(alert.id)}
                              aria-label="Marcar como leida"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDismiss(alert.id)}
                            aria-label="Descartar alerta"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
