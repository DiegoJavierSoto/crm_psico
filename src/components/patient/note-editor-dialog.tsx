'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useApiMutation } from '@/hooks/use-api'

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
}

const noteSchema = z.object({
  content: z.string().min(1, 'El contenido es obligatorio'),
  mood: z.string().optional(),
  techniques: z.string().optional(),
  homework: z.string().optional(),
  nextSessionPlan: z.string().optional(),
  isPrivate: z.boolean(),
})

type NoteFormValues = z.infer<typeof noteSchema>

const moodOptions = [
  { value: 'EXCELLENT', label: 'Excelente' },
  { value: 'GOOD', label: 'Bueno' },
  { value: 'NEUTRAL', label: 'Neutral' },
  { value: 'LOW', label: 'Bajo' },
  { value: 'CRITICAL', label: 'Critico' },
]

interface NoteEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  note?: SessionNote | null
}

export function NoteEditorDialog({
  open,
  onOpenChange,
  patientId,
  note,
}: NoteEditorDialogProps) {
  const mutation = useApiMutation<SessionNote, NoteFormValues & { patientId?: string }>()

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      content: note?.content || '',
      mood: note?.mood || '',
      techniques: note?.techniques || '',
      homework: note?.homework || '',
      nextSessionPlan: note?.nextSessionPlan || '',
      isPrivate: note?.isPrivate ?? true,
    },
    values: note ? {
      content: note.content,
      mood: note.mood || '',
      techniques: note.techniques || '',
      homework: note.homework || '',
      nextSessionPlan: note.nextSessionPlan || '',
      isPrivate: note.isPrivate,
    } : undefined,
  })

  async function onSubmit(data: NoteFormValues) {
    try {
      if (note) {
        await mutation.mutateAsync({
          url: `/api/session-notes/${note.id}`,
          method: 'PATCH',
          body: data,
        })
      } else {
        await mutation.mutateAsync({
          url: '/api/session-notes',
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {note ? 'Editar nota clinica' : 'Nueva nota clinica'}
          </DialogTitle>
          <DialogDescription>
            {note
              ? 'Modifica los detalles de la nota de sesion'
              : 'Registra las observaciones de la sesion'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenido de la nota</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones de la sesion..."
                      className="resize-none min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mood */}
            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado de animo observado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {moodOptions.map((m) => (
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

            {/* Techniques */}
            <FormField
              control={form.control}
              name="techniques"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tecnicas utilizadas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tecnicas aplicadas en la sesion..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Homework */}
            <FormField
              control={form.control}
              name="homework"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarea asignada</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tareas o ejercicios para el paciente..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Next Session Plan */}
            <FormField
              control={form.control}
              name="nextSessionPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan para proxima sesion</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Plan o enfoque para la siguiente sesion..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Private Toggle */}
            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Nota privada</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Solo visible para ti, no se comparte con el paciente
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                  note ? 'Guardar cambios' : 'Crear nota'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
