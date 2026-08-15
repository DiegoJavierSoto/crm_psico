'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useApi } from '@/hooks/use-api'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  getDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { AppointmentDialog } from './appointment-dialog'

// Types
interface Patient {
  id: string
  firstName: string
  lastName: string
}

interface Appointment {
  id: string
  patientId: string
  patient?: Patient
  date: string
  startTime: string
  endTime: string
  status: string
  type: string
  notes: string | null
}

const appointmentTypeLabels: Record<string, string> = {
  SESSION: 'Sesion',
  FOLLOW_UP: 'Seguimiento',
  INITIAL: 'Inicial',
  EVALUATION: 'Evaluacion',
}

const appointmentStatusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  SCHEDULED: { label: 'Programada', variant: 'secondary' },
  COMPLETED: { label: 'Completada', variant: 'default' },
  CANCELLED: { label: 'Cancelada', variant: 'destructive' },
  NO_SHOW: { label: 'No asistio', variant: 'outline' },
}

const timeSlots = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8
  return `${hour.toString().padStart(2, '0')}:00`
})

const dayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

export function CalendarPage() {
  const { calendarDate, setCalendarDate, setSelectedPatientId, setView } = useAppStore()
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  const currentDate = parseISO(calendarDate)
  const { data: appointments, isLoading } = useApi<Appointment[]>('/api/appointments')
  const { data: patients } = useApi<Patient[]>('/api/patients')

  // Navigation
  const goPrev = () => {
    const newDate = viewMode === 'week' ? subWeeks(currentDate, 1) : subMonths(currentDate, 1)
    setCalendarDate(format(newDate, 'yyyy-MM-dd'))
  }

  const goNext = () => {
    const newDate = viewMode === 'week' ? addWeeks(currentDate, 1) : addMonths(currentDate, 1)
    setCalendarDate(format(newDate, 'yyyy-MM-dd'))
  }

  const goToday = () => {
    setCalendarDate(format(new Date(), 'yyyy-MM-dd'))
  }

  // Week view data
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const end = endOfWeek(currentDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Month view data
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start, end })
    // Pad start of month
    const firstDayOfWeek = (getDay(start) + 6) % 7 // Monday = 0
    const paddingStart = Array.from({ length: firstDayOfWeek }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() - (firstDayOfWeek - i))
      return d
    })
    return [...paddingStart, ...days]
  }, [currentDate])

  // Appointments for a specific day
  const getAppointmentsForDay = (date: Date) => {
    if (!appointments) return []
    const dateStr = format(date, 'yyyy-MM-dd')
    return appointments.filter((a) => a.date === dateStr)
  }

  // Handle time slot click
  const handleSlotClick = (date: Date, time: string) => {
    setSelectedSlot({ date: format(date, 'yyyy-MM-dd'), time })
    setEditingAppointment(null)
    setDialogOpen(true)
  }

  // Handle appointment click
  const handleAppointmentClick = (apt: Appointment) => {
    setEditingAppointment(apt)
    setSelectedSlot({ date: apt.date, time: apt.startTime })
    setDialogOpen(true)
  }

  // Period label
  const periodLabel = viewMode === 'week'
    ? `${format(weekDays[0], 'd MMM', { locale: es })} - ${format(weekDays[6], 'd MMM yyyy', { locale: es })}`
    : format(currentDate, 'MMMM yyyy', { locale: es })

  // Legend
  const legendItems = [
    { color: 'bg-sage-500', label: 'Sesion' },
    { color: 'bg-amber-500', label: 'Inicial' },
    { color: 'bg-teal-500', label: 'Evaluacion' },
    { color: 'bg-primary/60', label: 'Seguimiento' },
  ]

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-14 rounded-xl bg-muted animate-pulse" />
        <div className="h-96 rounded-xl bg-muted animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev} aria-label="Anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goNext} aria-label="Siguiente">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday}>
            Hoy
          </Button>
          <h2 className="text-lg font-semibold text-foreground ml-2 capitalize">
            {periodLabel}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-3 mr-4">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={cn('h-2.5 w-2.5 rounded-full', item.color)} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className={cn(
                'rounded-none h-8 text-xs',
                viewMode === 'week' && 'bg-primary text-primary-foreground'
              )}
            >
              Semana
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className={cn(
                'rounded-none h-8 text-xs',
                viewMode === 'month' && 'bg-primary text-primary-foreground'
              )}
            >
              Mes
            </Button>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setSelectedSlot({ date: format(new Date(), 'yyyy-MM-dd'), time: '09:00' })
              setEditingAppointment(null)
              setDialogOpen(true)
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nueva cita
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      {viewMode === 'week' ? (
        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-280px)] min-h-[400px]">
              <div className="min-w-[700px]">
                {/* Day headers */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50">
                  <div className="p-2 text-xs text-muted-foreground text-center border-r border-border/50">
                    Hora
                  </div>
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'p-2 text-center border-r border-border/50 last:border-r-0',
                        isToday(day) && 'bg-primary/5'
                      )}
                    >
                      <p className="text-xs text-muted-foreground">{dayNames[(getDay(day) + 6) % 7]}</p>
                      <p className={cn(
                        'text-sm font-semibold',
                        isToday(day) ? 'text-primary' : 'text-foreground'
                      )}>
                        {format(day, 'd')}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Time grid */}
                {timeSlots.map((time) => (
                  <div key={time} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/30 last:border-b-0">
                    <div className="p-2 text-xs text-muted-foreground text-center border-r border-border/50 flex items-start justify-center pt-1">
                      {time}
                    </div>
                    {weekDays.map((day) => {
                      const dayApts = getAppointmentsForDay(day).filter(
                        (a) => a.startTime.startsWith(time.slice(0, 2))
                      )
                      return (
                        <div
                          key={day.toISOString() + time}
                          className={cn(
                            'min-h-[48px] p-1 border-r border-border/30 last:border-r-0 cursor-pointer',
                            'hover:bg-muted/30 transition-colors',
                            isToday(day) && 'bg-primary/[0.02]'
                          )}
                          onClick={() => handleSlotClick(day, time)}
                        >
                          {dayApts.map((apt) => (
                            <div
                              key={apt.id}
                              className={cn(
                                'rounded px-1.5 py-0.5 text-[10px] leading-tight cursor-pointer',
                                'hover:opacity-80 transition-opacity',
                                apt.type === 'SESSION' && 'bg-sage-200 text-sage-800',
                                apt.type === 'INITIAL' && 'bg-amber-200 text-amber-800',
                                apt.type === 'EVALUATION' && 'bg-teal-200 text-teal-800',
                                apt.type === 'FOLLOW_UP' && 'bg-primary/20 text-primary',
                              )}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAppointmentClick(apt)
                              }}
                            >
                              <span className="font-medium">
                                {apt.startTime}
                              </span>{' '}
                              {apt.patient
                                ? `${apt.patient.firstName} ${apt.patient.lastName}`
                                : 'Paciente'}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        /* Monthly View */
        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-7">
              {/* Day headers */}
              {dayNames.map((name) => (
                <div key={name} className="p-2 text-center text-xs font-medium text-muted-foreground border-b border-border/50">
                  {name}
                </div>
              ))}

              {/* Day cells */}
              {monthDays.map((day, idx) => {
                const dayApts = getAppointmentsForDay(day)
                const inCurrentMonth = isSameMonth(day, currentDate)
                return (
                  <div
                    key={idx}
                    className={cn(
                      'min-h-[80px] p-1.5 border-b border-r border-border/30 last:border-r-0 cursor-pointer',
                      'hover:bg-muted/30 transition-colors',
                      !inCurrentMonth && 'bg-muted/20',
                      isToday(day) && 'bg-primary/5'
                    )}
                    onClick={() => {
                      setCalendarDate(format(day, 'yyyy-MM-dd'))
                      setViewMode('week')
                    }}
                  >
                    <p className={cn(
                      'text-xs mb-1',
                      isToday(day) ? 'text-primary font-bold' :
                      inCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'
                    )}>
                      {format(day, 'd')}
                    </p>
                    <div className="space-y-0.5">
                      {dayApts.slice(0, 3).map((apt) => (
                        <div
                          key={apt.id}
                          className={cn(
                            'rounded px-1 py-0.5 text-[9px] leading-tight truncate',
                            apt.type === 'SESSION' && 'bg-sage-200 text-sage-800',
                            apt.type === 'INITIAL' && 'bg-amber-200 text-amber-800',
                            apt.type === 'EVALUATION' && 'bg-teal-200 text-teal-800',
                            apt.type === 'FOLLOW_UP' && 'bg-primary/20 text-primary',
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAppointmentClick(apt)
                          }}
                        >
                          {apt.startTime} {apt.patient ? `${apt.patient.firstName}` : ''}
                        </div>
                      ))}
                      {dayApts.length > 3 && (
                        <p className="text-[9px] text-muted-foreground">+{dayApts.length - 3} mas</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Dialog */}
      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedSlot={selectedSlot}
        appointment={editingAppointment}
        patients={patients || []}
      />
    </div>
  )
}
