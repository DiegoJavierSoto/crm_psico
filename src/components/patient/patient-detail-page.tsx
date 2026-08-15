'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Clock,
  FileText,
  ClipboardCheck,
  User,
  Edit,
  Lock,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useApi, useApiMutation } from '@/hooks/use-api'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { NoteEditorDialog } from './note-editor-dialog'
import { PatientFormDialog } from './patient-form-dialog'
import { FollowUpDialog } from '@/components/follow-ups/follow-up-dialog'

// Types
interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  dateOfBirth: string | null
  status: string
  reasonForConsult: string | null
  background: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  referredBy: string | null
  notes: string | null
  lastContactDate: string | null
  sessionFrequency: string
  createdAt: string
  appointments: Appointment[]
  sessionNotes: SessionNote[]
  followUps: FollowUp[]
}

interface Appointment {
  id: string
  patientId: string
  date: string
  startTime: string
  endTime: string
  status: string
  type: string
  notes: string | null
}

interface SessionNote {
  id: string
  patientId: string
  appointmentId: string | null
  content: string
  mood: string | null
  techniques: string | null
  homework: string | null
  nextSessionPlan: string | null
  isPrivate: boolean
  createdAt: string
}

interface FollowUp {
  id: string
  patientId: string
  type: string
  suggestedDate: string
  completedDate: string | null
  status: string
  notes: string | null
  contactMethod: string
  contactResult: string | null
  createdAt: string
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  ADMISSION: { label: 'En Admision', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  TREATMENT: { label: 'En Tratamiento', color: 'text-sage-700', bg: 'bg-sage-50 border-sage-200' },
  DISCHARGE: { label: 'Alta Terapeutica', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
  INACTIVE: { label: 'Inactivo', color: 'text-muted-foreground', bg: 'bg-muted/50 border-border' },
}

const appointmentStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  SCHEDULED: { label: 'Programada', variant: 'secondary' },
  COMPLETED: { label: 'Completada', variant: 'default' },
  CANCELLED: { label: 'Cancelada', variant: 'destructive' },
  NO_SHOW: { label: 'No asistio', variant: 'outline' },
}

const followUpTypeLabels: Record<string, string> = {
  CHECK_IN: 'Check-in',
  EVOLUTION_CONTROL: 'Control de Evolucion',
  RE_ENGAGEMENT: 'Re-enganche',
  POST_DISCHARGE: 'Post-alta',
}

const followUpStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Completado', color: 'bg-sage-100 text-sage-700' },
  OVERDUE: { label: 'Vencido', color: 'bg-destructive/10 text-destructive' },
  CANCELLED: { label: 'Cancelado', color: 'bg-muted text-muted-foreground' },
}

const moodLabels: Record<string, string> = {
  EXCELLENT: 'Excelente',
  GOOD: 'Bueno',
  NEUTRAL: 'Neutral',
  LOW: 'Bajo',
  CRITICAL: 'Critico',
}

export function PatientDetailPage() {
  const { selectedPatientId, setView } = useAppStore()
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<SessionNote | null>(null)
  const [patientFormOpen, setPatientFormOpen] = useState(false)
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false)
  const [expandedNote, setExpandedNote] = useState<string | null>(null)

  // Use the patient API which includes related data
  const { data: patient, isLoading: patientLoading } = useApi<Patient>(
    selectedPatientId ? `/api/patients/${selectedPatientId}` : null
  )

  // Extract related data from patient response
  const appointments = patient?.appointments || []
  const sessionNotes = patient?.sessionNotes || []
  const followUps = patient?.followUps || []

  if (patientLoading || !patient) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const config = statusConfig[patient.status] || statusConfig.ADMISSION
  const completedSessions = appointments.filter((a) => a.status === 'COMPLETED').length
  const totalSessions = appointments.length
  const attendanceRate = totalSessions > 0
    ? Math.round((completedSessions / totalSessions) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView('dashboard')}
        className="text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver al dashboard
      </Button>

      {/* Patient Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-border/50">
          <CardContent className="p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl font-bold text-foreground">
                      {patient.firstName} {patient.lastName}
                    </h1>
                    <Badge className={cn('text-xs', config.bg, config.color, 'border')}>
                      {config.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    {patient.email && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {patient.email}
                      </div>
                    )}
                    {patient.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {patient.phone}
                      </div>
                    )}
                    {patient.dateOfBirth && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(parseISO(patient.dateOfBirth), 'd MMM yyyy', { locale: es })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPatientFormOpen(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{totalSessions}</p>
                <p className="text-xs text-muted-foreground">Sesiones totales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{completedSessions}</p>
                <p className="text-xs text-muted-foreground">Completadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{attendanceRate}%</p>
                <p className="text-xs text-muted-foreground">Asistencia</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="sessions">
            <Clock className="h-4 w-4 mr-1.5" />
            Historial de Sesiones
          </TabsTrigger>
          <TabsTrigger value="notes">
            <FileText className="h-4 w-4 mr-1.5" />
            Notas Clinicas
          </TabsTrigger>
          <TabsTrigger value="followups">
            <ClipboardCheck className="h-4 w-4 mr-1.5" />
            Seguimientos
          </TabsTrigger>
          <TabsTrigger value="info">
            <User className="h-4 w-4 mr-1.5" />
            Informacion
          </TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Historial de sesiones</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No hay sesiones registradas
                </div>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-2">
                    {[...appointments]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((apt) => {
                        const statusCfg = appointmentStatusConfig[apt.status] || appointmentStatusConfig.SCHEDULED
                        return (
                          <div
                            key={apt.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Calendar className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground capitalize">
                                {format(parseISO(apt.date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {apt.startTime} - {apt.endTime} | {apt.type === 'SESSION' ? 'Sesion' : apt.type === 'INITIAL' ? 'Inicial' : apt.type === 'EVALUATION' ? 'Evaluacion' : 'Seguimiento'}
                              </p>
                            </div>
                            <Badge variant={statusCfg.variant} className="text-xs shrink-0">
                              {statusCfg.label}
                            </Badge>
                          </div>
                        )
                      })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clinical Notes Tab */}
        <TabsContent value="notes">
          <Card className="border-border/50">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Notas clinicas</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingNote(null)
                  setNoteDialogOpen(true)
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nueva Nota
              </Button>
            </CardHeader>
            <CardContent>
              {sessionNotes.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No hay notas clinicas registradas
                </div>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-3">
                    {[...sessionNotes]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((note) => {
                        const isExpanded = expandedNote === note.id
                        return (
                          <div
                            key={note.id}
                            className="border border-border/50 rounded-lg p-4 hover:border-primary/20 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium text-foreground">
                                  {format(parseISO(note.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                                </p>
                                {note.isPrivate && (
                                  <Badge variant="outline" className="text-[10px] gap-1">
                                    <Lock className="h-3 w-3" />
                                    Privado
                                  </Badge>
                                )}
                                {note.mood && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {moodLabels[note.mood] || note.mood}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setExpandedNote(isExpanded ? null : note.id)}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>

                            {note.techniques && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Tecnicas: {note.techniques}
                              </p>
                            )}

                            {isExpanded ? (
                              <div className="mt-3 space-y-3">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Contenido</p>
                                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                    {note.content}
                                  </p>
                                </div>
                                {note.homework && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Tarea asignada</p>
                                    <p className="text-sm text-foreground whitespace-pre-wrap">{note.homework}</p>
                                  </div>
                                )}
                                {note.nextSessionPlan && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Plan proxima sesion</p>
                                    <p className="text-sm text-foreground whitespace-pre-wrap">{note.nextSessionPlan}</p>
                                  </div>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingNote(note)
                                    setNoteDialogOpen(true)
                                  }}
                                >
                                  <Edit className="h-3.5 w-3.5 mr-1" />
                                  Editar nota
                                </Button>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {note.content}
                              </p>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follow-ups Tab */}
        <TabsContent value="followups">
          <Card className="border-border/50">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Seguimientos</CardTitle>
              <Button
                size="sm"
                onClick={() => setFollowUpDialogOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nuevo Seguimiento
              </Button>
            </CardHeader>
            <CardContent>
              {followUps.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No hay seguimientos registrados
                </div>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-3">
                    {[...followUps]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((fu) => {
                        const fuConfig = followUpStatusConfig[fu.status] || followUpStatusConfig.PENDING
                        return (
                          <div
                            key={fu.id}
                            className={cn(
                              'border rounded-lg p-4',
                              fu.status === 'OVERDUE' ? 'border-destructive/30 bg-destructive/5' : 'border-border/50'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-foreground">
                                    {followUpTypeLabels[fu.type] || fu.type}
                                  </p>
                                  <Badge className={cn('text-[10px]', fuConfig.color)}>
                                    {fuConfig.label}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Fecha sugerida: {format(parseISO(fu.suggestedDate), 'd MMM yyyy', { locale: es })}
                                </p>
                                {fu.completedDate && (
                                  <p className="text-xs text-muted-foreground">
                                    Completado: {format(parseISO(fu.completedDate), 'd MMM yyyy', { locale: es })}
                                  </p>
                                )}
                                {fu.notes && (
                                  <p className="text-sm text-muted-foreground mt-2">{fu.notes}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-[10px]">
                                  {fu.contactMethod === 'PHONE' ? 'Telefono' :
                                   fu.contactMethod === 'EMAIL' ? 'Email' : 'Mensaje'}
                                </Badge>
                                {fu.status === 'PENDING' || fu.status === 'OVERDUE' ? (
                                  <CompleteFollowUpButton followUpId={fu.id} />
                                ) : null}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Information Tab */}
        <TabsContent value="info">
          <Card className="border-border/50">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Informacion del paciente</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPatientFormOpen(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Datos personales</h3>
                  <Separator />
                  <InfoField label="Nombre" value={`${patient.firstName} ${patient.lastName}`} />
                  <InfoField label="Email" value={patient.email} />
                  <InfoField label="Telefono" value={patient.phone} />
                  <InfoField label="Fecha de nacimiento" value={patient.dateOfBirth ? format(parseISO(patient.dateOfBirth), 'd MMM yyyy', { locale: es }) : null} />
                  <InfoField label="Referido por" value={patient.referredBy} />
                </div>

                {/* Clinical Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Informacion clinica</h3>
                  <Separator />
                  <InfoField label="Estado" value={config.label} />
                  <InfoField label="Motivo de consulta" value={patient.reasonForConsult} />
                  <InfoField label="Antecedentes" value={patient.background} />
                  <InfoField label="Frecuencia de las sesiones" value={patient.sessionFrequency} />
                  <InfoField label="Ultimo contacto" value={patient.lastContactDate ? format(parseISO(patient.lastContactDate), 'd MMM yyyy', { locale: es }) : null} />
                  <InfoField label="Notas generales" value={patient.notes} />
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-sm font-semibold text-foreground">Contacto de emergencia</h3>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField label="Nombre" value={patient.emergencyContact} />
                    <InfoField label="Telefono" value={patient.emergencyPhone} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NoteEditorDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        patientId={patient.id}
        note={editingNote}
      />
      <PatientFormDialog
        open={patientFormOpen}
        onOpenChange={setPatientFormOpen}
        patient={patient}
      />
      <FollowUpDialog
        open={followUpDialogOpen}
        onOpenChange={setFollowUpDialogOpen}
        patientId={patient.id}
      />
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground mt-0.5">{value || '—'}</p>
    </div>
  )
}

function CompleteFollowUpButton({ followUpId }: { followUpId: string }) {
  const mutation = useApiMutation<FollowUp, { status: string; completedDate: string }>()

  const handleComplete = async () => {
    try {
      await mutation.mutateAsync({
        url: `/api/follow-ups/${followUpId}`,
        method: 'PATCH',
        body: { status: 'COMPLETED', completedDate: new Date().toISOString().split('T')[0] },
      })
    } catch {
      // Error handled silently
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs h-7"
      onClick={handleComplete}
      disabled={mutation.isPending}
    >
      Completar
    </Button>
  )
}
