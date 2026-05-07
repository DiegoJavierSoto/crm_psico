'use client'

import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import {
  Users,
  UserCheck,
  CalendarCheck,
  Bell,
  Clock,
  ChevronRight,
  AlertTriangle,
  Plus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useApi, useApiMutation } from '@/hooks/use-api'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'
import { format, parseISO, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { PatientFormDialog } from '@/components/patient/patient-form-dialog'

// Types
interface Patient {
  id: string
  firstName: string
  lastName: string
  status: string
  reasonForConsult: string | null
  lastContactDate: string | null
  createdAt: string
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
}

interface AlertItem {
  id: string
  type: string
  title: string
  message: string
  severity: string
  isRead: boolean
  createdAt: string
}

// Status configuration
const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ADMISSION: { label: 'En Admision', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  TREATMENT: { label: 'En Tratamiento', color: 'text-sage-700', bg: 'bg-sage-50', border: 'border-sage-200' },
  DISCHARGE: { label: 'Alta Terapeutica', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  INACTIVE: { label: 'Inactivo', color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border' },
}

const statusOrder = ['ADMISSION', 'TREATMENT', 'DISCHARGE', 'INACTIVE'] as const

// Droppable Column
function PipelineColumn({ status, patients, onPatientClick }: {
  status: string
  patients: Patient[]
  onPatientClick: (id: string) => void
}) {
  const config = statusConfig[status]
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-xl border transition-colors min-h-[200px]',
        config.border,
        isOver && 'ring-2 ring-primary/30 bg-primary/5'
      )}
    >
      <div className={cn('px-4 py-3 rounded-t-xl border-b', config.bg, config.border)}>
        <div className="flex items-center justify-between">
          <h3 className={cn('text-sm font-semibold', config.color)}>{config.label}</h3>
          <Badge variant="secondary" className="text-xs">{patients.length}</Badge>
        </div>
      </div>
      <SortableContext
        items={patients.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 p-2 space-y-2">
          {patients.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
              Sin pacientes
            </div>
          ) : (
            patients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onClick={() => onPatientClick(patient.id)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// Patient Card (draggable)
function PatientCard({ patient, onClick }: { patient: Patient; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = {
    setNodeRef: (_ref: HTMLElement | null) => {},
    attributes: {} as Record<string, unknown>,
    listeners: {} as Record<string, unknown>,
    transform: null as { x: number; y: number } | null,
    transition: undefined as string | undefined,
  }

  const name = `${patient.firstName} ${patient.lastName}`
  const lastContact = patient.lastContactDate
    ? format(parseISO(patient.lastContactDate), 'd MMM', { locale: es })
    : 'Sin contacto'

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-card rounded-lg border border-border/50 p-3 cursor-pointer',
        'hover:shadow-sm hover:border-primary/30 transition-all duration-150',
        'active:shadow-md'
      )}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
      }}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground leading-tight truncate">
          {name}
        </p>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
      </div>
      {patient.reasonForConsult && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {patient.reasonForConsult}
        </p>
      )}
      <div className="flex items-center gap-1.5 mt-2">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{lastContact}</span>
      </div>
    </div>
  )
}

// Stats Card
function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType
  label: string
  value: number | string
  color: string
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { setSelectedPatientId, setView } = useAppStore()
  const { data: patients, isLoading: patientsLoading } = useApi<Patient[]>('/api/patients')
  const { data: appointments } = useApi<Appointment[]>('/api/appointments')
  const { data: alerts } = useApi<AlertItem[]>('/api/alerts')
  const mutation = useApiMutation<Patient, { status: string }>()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [newPatientOpen, setNewPatientOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Group patients by status
  const patientsByStatus = useMemo(() => {
    const grouped: Record<string, Patient[]> = {
      ADMISSION: [],
      TREATMENT: [],
      DISCHARGE: [],
      INACTIVE: [],
    }
    if (patients) {
      for (const patient of patients) {
        const status = patient.status || 'ADMISSION'
        if (!grouped[status]) grouped[status] = []
        grouped[status].push(patient)
      }
    }
    return grouped
  }, [patients])

  // Stats
  const todayAppointments = useMemo(() => {
    if (!appointments) return []
    const today = format(new Date(), 'yyyy-MM-dd')
    return appointments.filter((a) => a.date === today)
  }, [appointments])

  const pendingAlerts = useMemo(() => {
    if (!alerts) return 0
    return alerts.filter((a) => !a.isRead).length
  }, [alerts])

  // Chart data (last 8 weeks) - counts real appointments per week
  const chartData = useMemo(() => {
    const weeks = []
    const now = new Date()
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      const weekLabel = format(weekStart, 'd MMM', { locale: es })
      const count = appointments
        ? appointments.filter((a) => {
            const aptDate = parseISO(a.date)
            return aptDate >= weekStart && aptDate <= weekEnd
          }).length
        : 0
      weeks.push({ week: weekLabel, citas: count })
    }
    return weeks
  }, [appointments])

  const handlePatientClick = (patientId: string) => {
    setSelectedPatientId(patientId)
    setView('patient-detail')
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // Visual feedback handled by isOver
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const patientId = active.id as string
    let newStatus = over.id as string

    // If dropped on another patient card, find which column
    if (!statusOrder.includes(newStatus as typeof statusOrder[number])) {
      // Find the patient's current column
      for (const status of statusOrder) {
        const found = patientsByStatus[status]?.find((p) => p.id === newStatus)
        if (found) {
          newStatus = status
          break
        }
      }
    }

    if (statusOrder.includes(newStatus as typeof statusOrder[number])) {
      try {
        await mutation.mutateAsync({
          url: `/api/patients/${patientId}`,
          method: 'PATCH',
          body: { status: newStatus },
        })
      } catch {
        // Error handled silently, data will refresh
      }
    }
  }

  if (patientsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const totalPatients = patients?.length || 0
  const treatmentCount = patientsByStatus.TREATMENT.length

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          icon={Users}
          label="Total Pacientes"
          value={totalPatients}
          color="bg-sage-100 text-sage-600"
        />
        <StatCard
          icon={UserCheck}
          label="En Tratamiento"
          value={treatmentCount}
          color="bg-teal-100 text-teal-600"
        />
        <StatCard
          icon={CalendarCheck}
          label="Citas Hoy"
          value={todayAppointments.length}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          icon={Bell}
          label="Alertas Pendientes"
          value={pendingAlerts}
          color="bg-rose-100 text-rose-600"
        />
      </motion.div>

      {/* Patient Pipeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Pipeline de Pacientes</h2>
          <Button
            size="sm"
            onClick={() => setNewPatientOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Paciente
          </Button>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusOrder.map((status) => (
              <PipelineColumn
                key={status}
                status={status}
                patients={patientsByStatus[status] || []}
                onPatientClick={handlePatientClick}
              />
            ))}
          </div>
          <DragOverlay>
            {activeId ? (
              <div className="bg-card rounded-lg border border-primary/30 shadow-lg p-3 opacity-90">
                <p className="text-sm font-medium text-foreground">
                  {patients?.find((p) => p.id === activeId)
                    ? `${patients.find((p) => p.id === activeId)!.firstName} ${patients.find((p) => p.id === activeId)!.lastName}`
                    : ''}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </motion.div>

      {/* Chart and Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Citas por semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={{ stroke: 'var(--border)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="citas"
                      fill="oklch(0.48 0.10 165)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Proximas citas</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-52">
                {appointments && appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments
                      .filter((a) => a.status === 'SCHEDULED')
                      .slice(0, 8)
                      .map((apt) => (
                        <div
                          key={apt.id}
                          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedPatientId(apt.patientId)
                            setView('patient-detail')
                          }}
                        >
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <CalendarCheck className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'Paciente'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {apt.date} - {apt.startTime} a {apt.endTime}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[10px] shrink-0',
                              apt.type === 'INITIAL' && 'bg-amber-100 text-amber-700',
                              apt.type === 'SESSION' && 'bg-sage-100 text-sage-700',
                              apt.type === 'EVALUATION' && 'bg-teal-100 text-teal-700',
                            )}
                          >
                            {apt.type === 'SESSION' ? 'Sesion' :
                             apt.type === 'INITIAL' ? 'Inicial' :
                             apt.type === 'EVALUATION' ? 'Evaluacion' : 'Seguimiento'}
                          </Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                    No hay citas programadas
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Alerts */}
      {alerts && alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Alertas recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <AlertTriangle
                      className={cn(
                        'h-4 w-4 mt-0.5 shrink-0',
                        alert.severity === 'URGENT' && 'text-destructive',
                        alert.severity === 'WARNING' && 'text-amber-500',
                        alert.severity === 'INFO' && 'text-primary'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(parseISO(alert.createdAt), 'd MMM', { locale: es })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* New Patient Dialog */}
      <PatientFormDialog
        open={newPatientOpen}
        onOpenChange={setNewPatientOpen}
      />
    </div>
  )
}
