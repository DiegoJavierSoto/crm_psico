'use client'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useApiMutation } from '@/hooks/use-api'

interface FollowUp {
  id: string
  patientId: string
  type: string
  suggestedDate: string
  completedDate: string | null
  status: string
  notes: string | null
  contactMethod: string
}

const followUpSchema = z.object({
  type: z.string().min(1, 'Selecciona el tipo de seguimiento'),
  suggestedDate: z.string().min(1, 'Selecciona la fecha sugerida'),
  contactMethod: z.string().min(1, 'Selecciona el metodo de contacto'),
  notes: z.string().optional(),
})

type FollowUpFormValues = z.infer<typeof followUpSchema>

const followUpTypes = [
  { value: 'CHECK_IN', label: 'Check-in' },
  { value: 'EVOLUTION_CONTROL', label: 'Control de Evolucion' },
  { value: 'RE_ENGAGEMENT', label: 'Re-enganche' },
  { value: 'POST_DISCHARGE', label: 'Post-alta' },
]

const contactMethods = [
  { value: 'PHONE', label: 'Telefono' },
  { value: 'EMAIL', label: 'Correo electronico' },
  { value: 'MESSAGE', label: 'Mensaje de texto' },
]

interface FollowUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  followUp?: FollowUp | null
}

export function FollowUpDialog({
  open,
  onOpenChange,
  patientId,
  followUp,
}: FollowUpDialogProps) {
  const mutation = useApiMutation<FollowUp, FollowUpFormValues>()

  const form = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      type: followUp?.type || 'CHECK_IN',
      suggestedDate: followUp?.suggestedDate || '',
      contactMethod: followUp?.contactMethod || 'PHONE',
      notes: followUp?.notes || '',
    },
  })

  async function onSubmit(data: FollowUpFormValues) {
    try {
      if (followUp) {
        await mutation.mutateAsync({
          url: `/api/follow-ups/${followUp.id}`,
          method: 'PATCH',
          body: data,
        })
      } else {
        await mutation.mutateAsync({
          url: '/api/follow-ups',
          method: 'POST',
          body: { ...data, patientId },
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
            {followUp ? 'Editar seguimiento' : 'Nuevo seguimiento'}
          </DialogTitle>
          <DialogDescription>
            {followUp
              ? 'Modifica los detalles del seguimiento'
              : 'Programa un seguimiento para este paciente'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de seguimiento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {followUpTypes.map((t) => (
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

            {/* Suggested Date */}
            <FormField
              control={form.control}
              name="suggestedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha sugerida</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Method */}
            <FormField
              control={form.control}
              name="contactMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metodo de contacto</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona metodo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contactMethods.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
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
                      placeholder="Notas sobre el seguimiento..."
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
                  followUp ? 'Guardar cambios' : 'Crear seguimiento'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
