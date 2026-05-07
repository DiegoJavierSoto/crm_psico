'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useApiMutation } from '@/hooks/use-api'

interface Patient {
  id: string
  firstName: string
  lastName: string
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

const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Selecciona un paciente'),
  date: z.string().min(1, 'Selecciona una fecha'),
  startTime: z.string().min(1, 'Selecciona hora de inicio'),
  endTime: z.string().min(1, 'Selecciona hora de fin'),
  type: z.string().min(1, 'Selecciona el tipo de cita'),
  notes: z.string().optional(),
})

type AppointmentFormValues = z.infer<typeof appointmentSchema>

const appointmentTypes = [
  { value: 'SESSION', label: 'Sesion' },
  { value: 'FOLLOW_UP', label: 'Seguimiento' },
  { value: 'INITIAL', label: 'Inicial' },
  { value: 'EVALUATION', label: 'Evaluacion' },
]

const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)
const quarterHours = Array.from({ length: 96 }, (_, i) => {
  const hour = Math.floor(i / 4)
  const minute = (i % 4) * 15
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}).filter((t) => {
  const hour = parseInt(t.split(':')[0])
  return hour >= 7 && hour <= 21
})

interface AppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedSlot: { date: string; time: string } | null
  appointment?: Appointment | null
  patients: Patient[]
}

export function AppointmentDialog({
  open,
  onOpenChange,
  selectedSlot,
  appointment,
  patients,
}: AppointmentDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const mutation = useApiMutation<Appointment, AppointmentFormValues>()

  const filteredPatients = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: appointment?.patientId || '',
      date: selectedSlot?.date || '',
      startTime: selectedSlot?.time || '09:00',
      endTime: appointment?.endTime || '10:00',
      type: appointment?.type || 'SESSION',
      notes: appointment?.notes || '',
    },
    values: appointment ? {
      patientId: appointment.patientId,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      type: appointment.type,
      notes: appointment.notes || '',
    } : undefined,
  })

  async function onSubmit(data: AppointmentFormValues) {
    try {
      if (appointment) {
        await mutation.mutateAsync({
          url: `/api/appointments/${appointment.id}`,
          method: 'PATCH',
          body: data,
        })
      } else {
        await mutation.mutateAsync({
          url: '/api/appointments',
          method: 'POST',
          body: data,
        })
      }
      onOpenChange(false)
      form.reset()
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Editar cita' : 'Nueva cita'}
          </DialogTitle>
          <DialogDescription>
            {appointment
              ? 'Modifica los detalles de la cita'
              : 'Completa los datos para crear una nueva cita'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Patient Select */}
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Buscar paciente..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="p-2">
                        <Input
                          placeholder="Buscar..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      {filteredPatients.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No se encontraron pacientes
                        </div>
                      ) : (
                        filteredPatients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.firstName} {p.lastName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Row */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora inicio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Inicio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-48">
                        {quarterHours.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora fin</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Fin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-48">
                        {quarterHours.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de cita</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {appointmentTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas sobre la cita..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  appointment ? 'Guardar cambios' : 'Crear cita'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
