'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Briefcase, ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAppStore } from '@/store/app-store'

const forgotPasswordSchema = z.object({
  email: z.email('Ingresa un correo electrónico válido'),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const { setView } = useAppStore()
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(data: ForgotPasswordValues) {
    setError(null)
    setSuccessMessage(null)
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Error al solicitar la recuperación')
      } else {
        setSuccessMessage(result.message || 'Solicitud completada. Por favor revisa tu correo.')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sage-50 via-background to-teal-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Briefcase className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">ConsultingDesk</span>
          </div>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Recuperar contraseña</CardTitle>
            <CardDescription>
              Introduce tu correo electrónico registrado para recibir el enlace de recuperación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {successMessage ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 py-4"
              >
                <div className="flex justify-center">
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <MailCheck className="h-10 w-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-foreground">Correo enviado</h3>
                  <p className="text-sm text-muted-foreground">
                    {successMessage}
                  </p>
                  <p className="text-xs text-primary/70 bg-primary/5 p-2 rounded border border-primary/10 mt-2">
                    Nota de desarrollo: Revisa la consola o <code>db/resets.log</code> para el enlace de restablecimiento.
                  </p>
                </div>
                <Button
                  onClick={() => setView('login')}
                  variant="outline"
                  className="mt-4 w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al inicio de sesión
                </Button>
              </motion.div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo electrónico</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="tu@correo.com"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando enlace...
                      </>
                    ) : (
                      'Enviar enlace de recuperación'
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {!successMessage && (
              <div className="mt-6 pt-4 border-t border-border/50 text-center">
                <button
                  onClick={() => setView('login')}
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 focus:outline-none"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Volver al inicio de sesión
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
